import { NextRequest, NextResponse } from 'next/server'
import { getDailyTasksByUser, getActiveChores } from '@/lib/airtable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    console.log('🔍 DEBUG get-daily-tasks API called with:', { userId, date })

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('📋 Fetching tasks for user:', userId)
    const tasks = await getDailyTasksByUser(userId, date || undefined)
    console.log('📋 Raw tasks from Airtable:', tasks.length, tasks)
    
    const chores = await getActiveChores()
    console.log('🧹 Active chores found:', chores.length)

    const tasksWithChores = tasks.map(task => {
      // The chore title comes from "Title (from Chore)" field which is an array
      const choreTitleField = task['Title (from Chore)'] || task.Chore
      console.log('🔍 Raw chore title field from Airtable:', choreTitleField, typeof choreTitleField)
      const choreTitle = choreTitleField && choreTitleField.length > 0 ? choreTitleField[0] : null
      console.log('🔍 Extracted choreTitle:', choreTitle)
      const chore = choreTitle ? chores.find(c => c.Title === choreTitle) : null
      console.log('🔍 Found matching chore:', chore)
      
      console.log('🔗 Processing task:', { 
        taskId: task.id, 
        choreTitle, 
        chore: chore?.Title,
        completed: task.Completed,
        approved: task.Approved 
      })
      
      return {
        ...task,
        chore,
        // Map the status based on the new boolean fields
        status: task.Approved ? 'approved' : (task.Completed ? 'submitted' : 'assigned')
      }
    })

    console.log('✅ Final tasks with chores:', tasksWithChores.length, tasksWithChores)

    return NextResponse.json({
      success: true,
      tasks: tasksWithChores
    })
  } catch (error) {
    console.error('❌ Get daily tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}