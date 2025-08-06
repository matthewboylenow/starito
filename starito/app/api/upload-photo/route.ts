import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const taskId = formData.get('taskId') as string
    const notes = formData.get('notes') as string || ''

    if (!file || !taskId) {
      return NextResponse.json(
        { error: 'Photo file and task ID are required' },
        { status: 400 }
      )
    }

    // Convert file to base64 for Airtable attachment
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Create attachment object for Airtable
    const attachment = {
      url: `data:${file.type};base64,${base64}`,
      filename: file.name
    }

    // Update the task with the photo
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/DailyTasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Photo URL': [attachment],
          'Photo Notes': notes,
          Completed: true // Mark as completed when photo is uploaded
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const updatedTask = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload photo', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}