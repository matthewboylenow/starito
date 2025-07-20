'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { UserWithStars, DailyTaskWithStatus } from '@/lib/types'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

export default function ParentDashboard() {
  const { currentParent, isAuthenticated, userType, logout } = useAuthStore()
  const router = useRouter()
  const { toasts, removeToast, success, error } = useToast()
  
  const [users, setUsers] = useState<UserWithStars[]>([])
  const [pendingTasks, setPendingTasks] = useState<(DailyTaskWithStatus & { user?: UserWithStars })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || userType !== 'parent') {
      router.push('/login')
      return
    }
    
    loadDashboardData()
  }, [isAuthenticated, userType, router])

  const loadDashboardData = async () => {
    try {
      const usersRes = await fetch('/api/get-users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        
        // Load star counts for each user
        const usersWithStars = await Promise.all(
          (usersData.users || []).map(async (user: UserWithStars) => {
            try {
              const starsRes = await fetch(`/api/get-stars?userId=${user.id}`)
              if (starsRes.ok) {
                const starsData = await starsRes.json()
                return { ...user, totalStars: starsData.stars || 0 }
              }
              return { ...user, totalStars: 0 }
            } catch {
              return { ...user, totalStars: 0 }
            }
          })
        )
        
        setUsers(usersWithStars)
        
        const allPendingTasks: (DailyTaskWithStatus & { user?: UserWithStars })[] = []
        
        for (const user of usersWithStars) {
          const tasksRes = await fetch(`/api/get-daily-tasks?userId=${user.id}`)
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json()
            const userPendingTasks = (tasksData.tasks || [])
              .filter((task: DailyTaskWithStatus) => task.status === 'submitted')
              .map((task: DailyTaskWithStatus) => ({
                ...task,
                user
              }))
            allPendingTasks.push(...userPendingTasks)
          }
        }
        
        setPendingTasks(allPendingTasks)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskApproval = async (taskId: string, approved: boolean, starsAwarded?: number) => {
    try {
      const response = await fetch('/api/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          approved,
          starsAwarded: approved ? starsAwarded : undefined,
          parentNotes: approved ? 'Great job!' : 'Please try again'
        })
      })
      
      if (response.ok) {
        const task = pendingTasks.find(t => t.id === taskId)
        if (approved) {
          success(`✅ Task "${task?.chore?.Title}" approved for ${task?.user?.Name}!`)
        } else {
          success(`❌ Task "${task?.chore?.Title}" rejected for ${task?.user?.Name}`)
        }
        loadDashboardData()
      } else {
        error('Failed to process task approval. Please try again.')
      }
    } catch (err) {
      console.error('Failed to approve task:', err)
      error('Failed to process task approval. Please try again.')
    }
  }

  const handleStarsAdjustment = async (userId: string, adjustment: number, reason: string) => {
    try {
      const response = await fetch('/api/adjust-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          points: adjustment, // Updated to match new API
          source: reason
        })
      })
      
      if (response.ok) {
        const user = users.find(u => u.id === userId)
        const adjustmentText = adjustment > 0 ? `+${adjustment}` : `${adjustment}`
        success(`⭐ ${adjustmentText} stars ${adjustment > 0 ? 'awarded to' : 'deducted from'} ${user?.Name}!`)
        loadDashboardData()
      } else {
        error('Failed to adjust stars. Please try again.')
      }
    } catch (err) {
      console.error('Failed to adjust stars:', err)
      error('Failed to adjust stars. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Parent Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {currentParent?.username}
            </p>
          </div>
          
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            👥 Kids Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                    👦
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.Name}</h3>
                    <p className="text-gray-600 text-sm">Child</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="star-icon">⭐</span>
                  <span className="font-semibold text-xl text-accent-yellow">
                    {user.totalStars || 0}
                  </span>
                  <span className="text-gray-600">stars</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStarsAdjustment(user.id, 5, 'Bonus stars from parent')}
                    className="flex-1 bg-success text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    +5 ⭐
                  </button>
                  <button
                    onClick={() => handleStarsAdjustment(user.id, -2, 'Penalty from parent')}
                    className="flex-1 bg-accent-pink text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                  >
                    -2 ⭐
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            ⏳ Tasks Awaiting Approval
          </h2>
          
          {pendingTasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600 mb-2">No tasks pending approval</p>
              <p className="text-2xl">✅</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {task.chore?.Title}
                        </h3>
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                          {task.user?.Name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="star-icon text-sm">⭐</span>
                        <span className="text-accent-yellow font-semibold">
                          {task.chore?.Stars} stars
                        </span>
                        <span className="text-gray-500 text-sm">
                          • Submitted recently
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleTaskApproval(task.id, false)}
                        className="bg-accent-pink text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => handleTaskApproval(task.id, true, task.chore?.Stars)}
                        className="bg-success text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                      >
                        ✅ Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            🎯 Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/parent/rewards')}
              className="card hover:bg-gray-50 text-center p-6 transition-colors"
            >
              <div className="text-3xl mb-2">🎁</div>
              <div className="font-semibold text-gray-800">Manage Rewards</div>
            </button>
            
            <button
              onClick={() => router.push('/parent/challenges')}
              className="card hover:bg-gray-50 text-center p-6 transition-colors"
            >
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold text-gray-800">Set Challenges</div>
            </button>
            
            <button
              onClick={() => router.push('/parent/transactions')}
              className="card hover:bg-gray-50 text-center p-6 transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">View History</div>
            </button>
            
            <button
              onClick={() => router.push('/parent/tasks')}
              className="card hover:bg-gray-50 text-center p-6 transition-colors"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold text-gray-800">Assign Tasks</div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}