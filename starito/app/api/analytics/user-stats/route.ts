import { NextRequest, NextResponse } from 'next/server'
import { getDailyTasksByUser, getTransactionsByUser, getUserStreak, getUserById } from '@/lib/airtable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '7')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get stats for the last N days
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    
    const dailyStats = []
    const transactions = await getTransactionsByUser(userId)
    const streak = await getUserStreak(userId, 'Daily')

    for (let i = 0; i < days; i++) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // Get tasks for this date
      const tasks = await getDailyTasksByUser(userId, dateStr)
      const completedTasks = tasks.filter(task => task.Completed)
      const approvedTasks = tasks.filter(task => task.Approved)
      
      // Get transactions for this date
      const dayTransactions = transactions.filter(t => t.Date === dateStr && t.Type === 'Earned')
      const starsEarned = dayTransactions.reduce((sum, t) => sum + t.Points, 0)
      
      dailyStats.unshift({
        date: dateStr,
        dateFormatted: date.toLocaleDateString(),
        tasksAssigned: tasks.length,
        tasksCompleted: completedTasks.length,
        tasksApproved: approvedTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        approvalRate: completedTasks.length > 0 ? Math.round((approvedTasks.length / completedTasks.length) * 100) : 0,
        starsEarned
      })
    }

    // Calculate overall stats
    const totalTasks = dailyStats.reduce((sum, day) => sum + day.tasksAssigned, 0)
    const totalCompleted = dailyStats.reduce((sum, day) => sum + day.tasksCompleted, 0)
    const totalApproved = dailyStats.reduce((sum, day) => sum + day.tasksApproved, 0)
    const totalStars = dailyStats.reduce((sum, day) => sum + day.starsEarned, 0)
    
    const overallStats = {
      totalTasks,
      totalCompleted,
      totalApproved,
      totalStars,
      overallCompletionRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      overallApprovalRate: totalCompleted > 0 ? Math.round((totalApproved / totalCompleted) * 100) : 0,
      averageStarsPerDay: Math.round(totalStars / days * 10) / 10,
      currentStreak: streak?.['Current Streak'] || 0,
      longestStreak: streak?.['Longest Streak'] || 0
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.Name
      },
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      dailyStats,
      overallStats
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get user stats' },
      { status: 500 }
    )
  }
}