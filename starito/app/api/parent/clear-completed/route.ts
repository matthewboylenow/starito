import { NextRequest, NextResponse } from 'next/server'
import { getCompletedTasks, bulkDeleteTasks } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { date, userId } = await request.json()
    
    console.log('🧹 Parent clearing completed tasks:', { date, userId })
    
    // Get completed tasks
    let completedTasks = await getCompletedTasks(date)
    
    // Filter by user if specified
    if (userId) {
      // Get user name to match against tasks
      const userResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/get-users`)
      if (userResponse.ok) {
        const usersData = await userResponse.json()
        const user = usersData.users?.find((u: any) => u.id === userId)
        if (user) {
          completedTasks = completedTasks.filter(task => 
            task.User && task.User.includes(user.Name)
          )
        }
      }
    }
    
    console.log(`📋 Found ${completedTasks.length} completed tasks to clear`)
    
    if (completedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed tasks found to clear',
        tasksCleared: 0,
        date: date || 'all dates',
        userId: userId || 'all users'
      })
    }
    
    // Extract task IDs
    const taskIds = completedTasks.map(task => task.id)
    
    // Bulk delete tasks
    await bulkDeleteTasks(taskIds)
    
    console.log(`✅ Successfully cleared ${taskIds.length} completed tasks`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${taskIds.length} completed tasks`,
      tasksCleared: taskIds.length,
      date: date || 'all dates',
      userId: userId || 'all users'
    })
  } catch (error) {
    console.error('❌ Clear completed tasks error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear completed tasks', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}