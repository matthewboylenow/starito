import { NextRequest, NextResponse } from 'next/server'
import { updateDailyTask, createTransaction } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { taskId, approved, parentNotes, starsAwarded } = await request.json()

    if (!taskId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Task ID and approval status are required' },
        { status: 400 }
      )
    }

    // Update the task with new boolean values according to schema
    const updates: any = {
      Approved: approved,
      'Stars Earned': approved && starsAwarded ? starsAwarded : 0
    }

    const updatedTask = await updateDailyTask(taskId, updates)

    // If approved and stars awarded, create transaction
    if (approved && starsAwarded && updatedTask.User && updatedTask.User.length > 0) {
      const userName = updatedTask.User[0] // Get user name from linked field
      
      await createTransaction({
        User: [userName], // Use the name directly since it links to Users.Name column
        Type: 'Earned',
        Points: starsAwarded,
        Source: `Completed task: ${parentNotes || 'Task approved'}`,
        Date: new Date().toISOString().split('T')[0]
      })
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    })
  } catch (error) {
    console.error('Approve task error:', error)
    return NextResponse.json(
      { error: 'Failed to approve task' },
      { status: 500 }
    )
  }
}