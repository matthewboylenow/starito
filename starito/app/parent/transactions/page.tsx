'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Transaction, User } from '@/lib/types'

export default function ViewHistoryPage() {
  const { isAuthenticated, userType } = useAuthStore()
  const router = useRouter()
  const [transactions, setTransactions] = useState<(Transaction & { user?: User })[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || userType !== 'parent') {
      router.push('/login')
      return
    }
    
    loadData()
  }, [isAuthenticated, userType, router])

  const loadData = async () => {
    try {
      const usersRes = await fetch('/api/get-users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
        
        // Load transactions for all users
        const allTransactions: (Transaction & { user?: User })[] = []
        for (const user of usersData.users || []) {
          try {
            const transRes = await fetch(`/api/get-transactions?userId=${user.id}`)
            if (transRes.ok) {
              const transData = await transRes.json()
              const userTransactions = (transData.transactions || []).map((trans: Transaction) => ({
                ...trans,
                user
              }))
              allTransactions.push(...userTransactions)
            }
          } catch (error) {
            console.error(`Failed to load transactions for user ${user.id}:`, error)
          }
        }
        
        // Sort by date
        allTransactions.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        setTransactions(allTransactions)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading history...</p>
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
              Transaction History
            </h1>
            <p className="text-gray-600">View all star transactions for your kids</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="grid gap-4">
          {transactions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600 mb-2">No transactions yet</p>
              <p className="text-2xl">📊</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {transaction.Source}
                      </h3>
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                        {transaction.user?.Name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="star-icon">⭐</span>
                      <span className={`font-semibold ${
                        transaction.Points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.Points > 0 ? '+' : ''}{transaction.Points} stars
                      </span>
                      <span className="text-gray-600 text-sm">
                        • {transaction.Type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {new Date(transaction.Date).toLocaleDateString()}
                    </p>
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