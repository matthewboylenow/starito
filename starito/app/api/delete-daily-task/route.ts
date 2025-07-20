import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
const BASE_ID = process.env.AIRTABLE_BASE_ID!
const API_KEY = process.env.AIRTABLE_API_KEY!

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

export async function DELETE(request: NextRequest) {
  try {
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/DailyTasks/${taskId}`, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Delete daily task error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}