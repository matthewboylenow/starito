import { NextRequest, NextResponse } from 'next/server'
import { getDailyTasksByUser, getActiveChores, getChildren } from '@/lib/airtable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // Get all children
    const children = await getChildren()
    const chores = await getActiveChores()

    // Get tasks for all children
    const allTasks = []
    for (const child of children) {
      const tasks = await getDailyTasksByUser(child.id, date || undefined)
      for (const task of tasks) {
        // task.Chore now contains chore titles (not IDs) since it links to Chores.Title
        const choreTitle = task.Chore && task.Chore.length > 0 ? task.Chore[0] : null
        const chore = choreTitle ? chores.find(c => c.Title === choreTitle) : null
        const user = child // Use the current child as the user
        
        allTasks.push({
          ...task,
          chore,
          user,
          status: task.Approved ? 'approved' : (task.Completed ? 'submitted' : 'assigned')
        })
      }
    }

    return NextResponse.json({
      success: true,
      tasks: allTasks
    })
  } catch (error) {
    console.error('Get all daily tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch all daily tasks' },
      { status: 500 }
    )
  }
}