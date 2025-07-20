'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { DailyTaskWithStatus, Reward, Challenge } from '@/lib/types'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

export default function KidDashboard() {
  const { currentUser, isAuthenticated, userType, logout, updateUserStars } = useAuthStore()
  const router = useRouter()
  const { toasts, removeToast, success, error } = useToast()
  
  const [tasks, setTasks] = useState<DailyTaskWithStatus[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userStars, setUserStars] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || userType !== 'child') {
      router.push('/login')
      return
    }
    
    loadDashboardData()
  }, [isAuthenticated, userType, router])

  const loadDashboardData = async () => {
    if (!currentUser) return
    
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const [tasksRes, rewardsRes, starsRes] = await Promise.all([
        fetch(`/api/get-daily-tasks?userId=${currentUser.id}&date=${today}`),
        fetch('/api/get-rewards'),
        fetch(`/api/get-stars?userId=${currentUser.id}`)
      ])
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])
      }
      
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json()
        setRewards(rewardsData.rewards || [])
      }
      
      if (starsRes.ok) {
        const starsData = await starsRes.json()
        setUserStars(starsData.stars || 0)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskSubmit = async (taskId: string) => {
    try {
      const response = await fetch('/api/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      
      if (response.ok) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Failed to submit task:', error)
    }
  }

  const handleRewardRedeem = async (reward: Reward) => {
    if (!currentUser || userStars < reward.Cost) return
    
    try {
      const response = await fetch('/api/redeem-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          rewardId: reward.id,
          rewardName: reward.Name,
          starCost: reward.Cost
        })
      })
      
      if (response.ok) {
        // Reload dashboard to refresh star count
        loadDashboardData()
        success(`🎉 You redeemed ${reward.Name}!`)
      } else {
        error('Failed to redeem reward. Please try again.')
      }
    } catch (err) {
      console.error('Failed to redeem reward:', err)
      error('Failed to redeem reward. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🌟</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-yellow/10">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="bg-gradient-primary text-white shadow-lg p-6">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">
              Hi, {currentUser.Name}! 👋
            </h1>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-2xl text-accent-yellow">
                {userStars}
              </span>
              <span className="text-white/90 font-medium">stars</span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-warm p-3 rounded-xl">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-800">
              Today&apos;s Tasks
            </h2>
          </div>
          
          {tasks.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 text-center border border-white/20">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-600 text-lg font-medium">No tasks for today!</p>
              <p className="text-gray-500 mt-2">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-white/20 ${
                    task.status === 'approved' ? 'bg-gradient-to-r from-success-50 to-white ring-2 ring-success-500/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-3">
                        {task.chore?.Title || 'Loading...'}
                      </h3>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-accent-yellow/20 to-accent-orange/20 rounded-full px-4 py-2 w-fit">
                        <span className="text-2xl">⭐</span>
                        <span className="text-accent-orange font-bold text-lg">
                          {task.chore?.Stars} stars
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handleTaskSubmit(task.id)}
                          className="bg-gradient-success hover:shadow-glow-success text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                        >
                          ✓ Done!
                        </button>
                      )}
                      {task.status === 'submitted' && (
                        <div className="bg-gradient-to-r from-accent-yellow/20 to-accent-orange/20 px-4 py-2 rounded-xl">
                          <span className="text-accent-orange font-bold">
                            ⏳ Waiting for approval
                          </span>
                        </div>
                      )}
                      {task.status === 'approved' && (
                        <div className="bg-gradient-to-r from-success-500/20 to-success-600/20 px-4 py-2 rounded-xl">
                          <span className="text-success-600 font-bold">
                            ✅ Completed!
                          </span>
                        </div>
                      )}
                      {task.status === 'rejected' && (
                        <div className="bg-gradient-to-r from-accent-pink/20 to-red-400/20 px-4 py-2 rounded-xl">
                          <span className="text-accent-pink font-bold">
                            ❌ Try again
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-warm p-3 rounded-xl">
              <span className="text-2xl">🎁</span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-800">
              Available Rewards
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => {
              const canAfford = userStars >= reward.Cost
              
              return (
                <div key={reward.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-gray-800 flex-1">
                      {reward.Name}
                    </h3>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-accent-yellow/20 to-accent-orange/20 rounded-full px-3 py-1">
                      <span className="text-lg">⭐</span>
                      <span className="text-accent-orange font-bold">
                        {reward.Cost}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRewardRedeem(reward)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform ${
                      canAfford
                        ? 'bg-gradient-warm hover:shadow-glow text-white hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '🎁 Redeem' : '🔒 Need more stars'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}