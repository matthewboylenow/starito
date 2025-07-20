import { NextRequest, NextResponse } from 'next/server'
import { updateDailyTask } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { taskId, photoUrl } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const updatedTask = await updateDailyTask(taskId, {
      Completed: true // Mark as completed according to new schema
    })

    return NextResponse.json({
      success: true,
      task: updatedTask
    })
  } catch (error) {
    console.error('Submit task error:', error)
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    )
  }
}