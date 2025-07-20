'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Challenge, User } from '@/lib/types'

export default function ManageChallengesPage() {
  const { isAuthenticated, userType } = useAuthStore()
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    bonusStars: 5,
    userId: '',
    expiration: ''
  })

  useEffect(() => {
    if (!isAuthenticated || userType !== 'parent') {
      router.push('/login')
      return
    }
    
    loadData()
  }, [isAuthenticated, userType, router])

  const loadData = async () => {
    try {
      const [challengesRes, usersRes] = await Promise.all([
        fetch('/api/get-challenges'),
        fetch('/api/get-users')
      ])
      
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json()
        setChallenges(challengesData.challenges || [])
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        // Filter to only children
        const children = (usersData.users || []).filter((user: User) => user.Role === 'Child')
        setUsers(children)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/set-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          description: formData.description,
          bonusStars: formData.bonusStars,
          endDate: formData.expiration
        })
      })
      
      if (response.ok) {
        setShowForm(false)
        setFormData({ description: '', bonusStars: 5, userId: '', expiration: '' })
        loadData() // Reload challenges
      }
    } catch (error) {
      console.error('Failed to create challenge:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-accent-yellow/10">
      <header className="bg-gradient-primary text-white shadow-lg p-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <button
              onClick={() => router.push('/parent')}
              className="text-white/80 hover:text-white mb-2 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="font-heading text-3xl font-bold mb-2">
              Set Challenges
            </h1>
            <p className="text-white/90">Create and manage challenges for your kids</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 backdrop-blur-sm"
          >
            + New Challenge
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {showForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card p-6 mb-6 border border-white/20">
            <h3 className="font-heading text-xl font-bold text-gray-800 mb-4">Create New Challenge</h3>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Complete all tasks for 3 days in a row"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Child
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a child</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.Name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Stars
                  </label>
                  <input
                    type="number"
                    value={formData.bonusStars}
                    onChange={(e) => setFormData({ ...formData, bonusStars: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="1"
                    max="50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiration}
                    onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-glow transition-all duration-300"
                >
                  Create Challenge
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {challenges.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 text-center border border-white/20">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 text-lg font-medium mb-2">No challenges configured</p>
              <p className="text-gray-500">Click "New Challenge" to create your first challenge!</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-white/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-800 mb-3">
                      {challenge.Description}
                    </h3>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-accent-yellow/20 to-accent-orange/20 rounded-full px-4 py-2 w-fit mb-3">
                      <span className="text-2xl">⭐</span>
                      <span className="font-bold text-lg text-accent-orange">
                        {challenge['Bonus Stars']} bonus stars
                      </span>
                    </div>
                    {challenge.Expiration && (
                      <p className="text-gray-600 text-sm">
                        📅 Expires: {new Date(challenge.Expiration).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                      challenge['Active Today']
                        ? 'bg-gradient-to-r from-success-500/20 to-success-600/20 text-success-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {challenge['Active Today'] ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}