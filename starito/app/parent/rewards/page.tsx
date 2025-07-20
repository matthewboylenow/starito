'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Reward } from '@/lib/types'

export default function ManageRewardsPage() {
  const { isAuthenticated, userType } = useAuthStore()
  const router = useRouter()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    maxUsesPerDay: '',
    available: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || userType !== 'parent') {
      router.push('/login')
      return
    }
    
    loadRewards()
  }, [isAuthenticated, userType, router])

  const loadRewards = async () => {
    try {
      const response = await fetch('/api/get-rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards || [])
      }
    } catch (error) {
      console.error('Failed to load rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      cost: '',
      maxUsesPerDay: '',
      available: true
    })
    setEditingReward(null)
    setShowCreateForm(false)
  }

  const handleCreateReward = async () => {
    if (!formData.name || !formData.cost) {
      alert('Name and cost are required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/create-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          cost: parseInt(formData.cost),
          maxUsesPerDay: formData.maxUsesPerDay ? parseInt(formData.maxUsesPerDay) : undefined,
          available: formData.available
        })
      })

      if (response.ok) {
        await loadRewards()
        resetForm()
        alert('Reward created successfully!')
      } else {
        alert('Failed to create reward. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create reward:', error)
      alert('Failed to create reward. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateReward = async () => {
    if (!editingReward || !formData.name || !formData.cost) {
      alert('Name and cost are required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/update-reward', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: editingReward.id,
          name: formData.name,
          cost: parseInt(formData.cost),
          maxUsesPerDay: formData.maxUsesPerDay ? parseInt(formData.maxUsesPerDay) : undefined,
          available: formData.available
        })
      })

      if (response.ok) {
        await loadRewards()
        resetForm()
        alert('Reward updated successfully!')
      } else {
        alert('Failed to update reward. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update reward:', error)
      alert('Failed to update reward. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setFormData({
      name: reward.Name,
      cost: reward.Cost.toString(),
      maxUsesPerDay: reward['Max Uses/Day']?.toString() || '',
      available: reward.Available
    })
    setShowCreateForm(true)
  }

  const toggleRewardAvailability = async (reward: Reward) => {
    try {
      const response = await fetch('/api/update-reward', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          available: !reward.Available
        })
      })

      if (response.ok) {
        await loadRewards()
      } else {
        alert('Failed to update reward availability.')
      }
    } catch (error) {
      console.error('Failed to update reward availability:', error)
      alert('Failed to update reward availability.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <button
              onClick={() => router.push('/parent')}
              className="text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Manage Rewards
            </h1>
            <p className="text-gray-600">Configure available rewards for your kids</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-bold text-gray-800">
              🎁 Manage Rewards
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              + Add New Reward
            </button>
          </div>

          {showCreateForm && (
            <div className="card mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Extra Screen Time"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Star Cost
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="10"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses/Day (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerDay}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerDay: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={editingReward ? handleUpdateReward : handleCreateReward}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    submitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-success text-white hover:bg-green-600'
                  }`}
                >
                  {submitting ? 'Saving...' : (editingReward ? 'Update Reward' : 'Create Reward')}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-heading text-lg font-bold text-gray-800 mb-4">Current Rewards</h3>
          
          <div className="grid gap-4">
            {rewards.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600 mb-2">No rewards configured</p>
                <p className="text-2xl">🎁</p>
              </div>
            ) : (
              rewards.map((reward) => (
                <div key={reward.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {reward.Name}
                      </h3>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="star-icon">⭐</span>
                          <span className="font-semibold text-accent-yellow">
                            {reward.Cost} stars
                          </span>
                        </div>
                        {reward['Max Uses/Day'] && (
                          <span className="text-gray-600 text-sm">
                            Max {reward['Max Uses/Day']} uses/day
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRewardAvailability(reward)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          reward.Available 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {reward.Available ? 'Available' : 'Disabled'}
                      </button>
                      
                      <button
                        onClick={() => handleEditReward(reward)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}