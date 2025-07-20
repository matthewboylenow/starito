'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { User, Chore, DailyTaskWithStatus } from '@/lib/types'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

export default function ManageTasksPage() {
  const { isAuthenticated, userType } = useAuthStore()
  const router = useRouter()
  const { toasts, removeToast, success, error } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [dailyTasks, setDailyTasks] = useState<DailyTaskWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChore, setSelectedChore] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || userType !== 'parent') {
      router.push('/login')
      return
    }
    
    loadData()
  }, [isAuthenticated, userType, router])

  useEffect(() => {
    if (isAuthenticated && userType === 'parent') {
      loadData()
    }
  }, [selectedDate])

  const loadData = async () => {
    try {
      const [usersRes, choresRes, tasksRes] = await Promise.all([
        fetch('/api/get-users'),
        fetch('/api/get-chores'),
        fetch(`/api/get-all-daily-tasks?date=${selectedDate}`)
      ])
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
      
      if (choresRes.ok) {
        const choresData = await choresRes.json()
        setChores(choresData.chores || [])
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setDailyTasks(tasksData.tasks || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async () => {
    if (!selectedChore || !selectedUser) {
      error('Please select both a chore and a child')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch('/api/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          choreId: selectedChore,
          date: selectedDate
        })
      })

      if (response.ok) {
        const selectedUserName = users.find(u => u.id === selectedUser)?.Name
        const selectedChoreName = chores.find(c => c.id === selectedChore)?.Title
        success(`✅ Task "${selectedChoreName}" assigned to ${selectedUserName}!`)
        setSelectedChore('')
        setSelectedUser('')
        // Reload data to show the new task
        loadData()
      } else {
        error('Failed to assign task. Please try again.')
      }
    } catch (err) {
      console.error('Failed to assign task:', err)
      error('Failed to assign task. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete the task "${taskTitle}" for ${userName}?`)) {
      return
    }

    try {
      const response = await fetch('/api/delete-daily-task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        success(`🗑️ Task "${taskTitle}" deleted successfully!`)
        loadData()
      } else {
        error('Failed to delete task. Please try again.')
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
      error('Failed to delete task. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading tasks...</p>
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
            <button
              onClick={() => router.push('/parent')}
              className="text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Assign Tasks
            </h1>
            <p className="text-gray-600">Manage chores and assign tasks to your kids</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            🎯 Assign Tasks
          </h2>
          
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Create New Task Assignment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Chore
                </label>
                <select
                  value={selectedChore}
                  onChange={(e) => setSelectedChore(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Choose a chore...</option>
                  {chores.filter(chore => chore.Active).map((chore) => (
                    <option key={chore.id} value={chore.id}>
                      {chore.Title} ({chore.Stars} ⭐)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Child
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Choose a child...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.Name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleAssignTask}
                  disabled={assigning || !selectedChore || !selectedUser}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    assigning || !selectedChore || !selectedUser
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-blue-600'
                  }`}
                >
                  {assigning ? 'Assigning...' : '✅ Assign Task'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            Available Chores
          </h2>
          
          <div className="grid gap-4">
            {chores.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600 mb-2">No chores configured</p>
                <p className="text-2xl">📋</p>
              </div>
            ) : (
              chores.map((chore) => (
                <div key={chore.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {chore.Title}
                      </h3>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="star-icon">⭐</span>
                          <span className="font-semibold text-accent-yellow">
                            {chore.Stars} stars
                          </span>
                        </div>
                        <span className="text-gray-600 text-sm">
                          {chore.Frequency}
                        </span>
                        {chore.Required && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        chore.Active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chore.Active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            Kids
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
                    👦
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.Name}</h3>
                    <p className="text-gray-600 text-sm">Child</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-gray-800 mb-4">
            📅 Assigned Tasks for {new Date(selectedDate).toLocaleDateString()}
          </h2>
          
          {dailyTasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600 mb-2">No tasks assigned for this date</p>
              <p className="text-2xl">📋</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dailyTasks.map((task) => (
                <div key={task.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {task.chore?.Title || 'Unknown Chore'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          task.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : task.status === 'submitted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status === 'approved' ? '✅ Approved' : 
                           task.status === 'submitted' ? '⏳ Pending' : 
                           '📋 Assigned'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>👦</span>
                          <span>{task.user?.Name || 'Unknown User'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="star-icon text-sm">⭐</span>
                          <span className="text-accent-yellow font-semibold">
                            {task.chore?.Stars || 0} stars
                          </span>
                        </div>
                        <div>
                          📅 {new Date(task.Date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteTask(task.id, task.chore?.Title || 'Task', task.user?.Name || 'User')}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}