interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export class NotificationService {
  private static instance: NotificationService
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }
  
  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission()
    }
    return 'denied'
  }
  
  async showNotification(payload: NotificationPayload): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-192x192.png',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions
      })
    }
  }
  
  // Service Worker push notification
  async sendPushNotification(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification: payload
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send push notification')
      }
    } catch (error) {
      console.error('Push notification error:', error)
    }
  }
  
  // Smart notification helpers
  async notifyTaskReminder(userName: string, incompleteTasks: number): Promise<void> {
    const payload: NotificationPayload = {
      title: '⏰ Task Reminder',
      body: `Hi ${userName}! You have ${incompleteTasks} tasks left to complete today.`,
      icon: '/icons/icon-192x192.png',
      tag: 'task-reminder',
      actions: [
        { action: 'view-tasks', title: 'View Tasks' },
        { action: 'dismiss', title: 'Later' }
      ]
    }
    
    await this.showNotification(payload)
  }
  
  async notifyParentTaskSubmitted(childName: string, taskTitle: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '📋 Task Submitted',
      body: `${childName} has completed "${taskTitle}" and is waiting for approval.`,
      icon: '/icons/icon-192x192.png',
      tag: 'task-submitted',
      requireInteraction: true,
      actions: [
        { action: 'approve-task', title: 'Approve' },
        { action: 'view-task', title: 'Review' }
      ]
    }
    
    await this.showNotification(payload)
  }
  
  async notifyTaskApproved(taskTitle: string, starsEarned: number): Promise<void> {
    const payload: NotificationPayload = {
      title: '🎉 Task Approved!',
      body: `"${taskTitle}" approved! You earned ${starsEarned} stars! ⭐`,
      icon: '/icons/icon-192x192.png',
      tag: 'task-approved',
      requireInteraction: false
    }
    
    await this.showNotification(payload)
  }
  
  async notifyAchievementUnlocked(badgeName: string, badgeIcon: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '🏆 Achievement Unlocked!',
      body: `${badgeIcon} You earned the "${badgeName}" badge!`,
      icon: '/icons/icon-192x192.png',
      tag: 'achievement',
      requireInteraction: true,
      actions: [
        { action: 'view-achievements', title: 'View All' }
      ]
    }
    
    await this.showNotification(payload)
  }
  
  async notifyStreakMilestone(streak: number): Promise<void> {
    const payload: NotificationPayload = {
      title: '🔥 Streak Milestone!',
      body: `Amazing! You've completed tasks for ${streak} days in a row!`,
      icon: '/icons/icon-192x192.png',
      tag: 'streak-milestone',
      requireInteraction: false
    }
    
    await this.showNotification(payload)
  }
  
  async notifyWeeklySummary(childName: string, tasksCompleted: number, starsEarned: number, streakDays: number): Promise<void> {
    const payload: NotificationPayload = {
      title: '📊 Weekly Summary',
      body: `${childName} completed ${tasksCompleted} tasks, earned ${starsEarned} stars, and maintained a ${streakDays}-day streak!`,
      icon: '/icons/icon-192x192.png',
      tag: 'weekly-summary',
      requireInteraction: false
    }
    
    await this.showNotification(payload)
  }
}

export const notifications = NotificationService.getInstance()