import { NextRequest, NextResponse } from 'next/server'
import { createDailyTask, getUserById, getActiveChores, getDailyTasksByUser } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { userId, choreId, date } = await request.json()

    if (!userId || !choreId) {
      return NextResponse.json(
        { error: 'User ID and Chore ID are required' },
        { status: 400 }
      )
    }

    // Get user and chore details since linked records link to name/title columns
    const [user, chores] = await Promise.all([
      getUserById(userId),
      getActiveChores()
    ])
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const chore = chores.find(c => c.id === choreId)
    if (!chore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      )
    }

    const taskDate = date || new Date().toISOString().split('T')[0]

    // Check if task already exists for this user, chore, and date
    const existingTasks = await getDailyTasksByUser(userId, taskDate)
    const existingTask = existingTasks.find(task => 
      task.Chore && task.Chore.includes(chore.Title)
    )
    
    if (existingTask) {
      return NextResponse.json(
        { error: 'Task already assigned for this date' },
        { status: 409 }
      )
    }

    const dailyTask = await createDailyTask({
      Date: taskDate,
      User: [userId], // Link to Users table using record ID
      Chore: [choreId], // Link to Chores table using record ID
      Completed: false,
      Approved: false,
      'Stars Earned': 0
    })

    return NextResponse.json({
      success: true,
      task: dailyTask
    })
  } catch (error) {
    console.error('Assign task error:', error)
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}