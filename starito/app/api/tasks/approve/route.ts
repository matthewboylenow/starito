import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { taskId, kidId } = await request.json()
    
    console.log(`Approving task ${taskId} for kid ${kidId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Task approved successfully',
      taskId,
      kidId 
    })
  } catch (error) {
    console.error('Error approving task:', error)
    return NextResponse.json(
      { error: 'Failed to approve task' },
      { status: 500 }
    )
  }
}