import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const userId = formData.get('userId') as string
    const taskId = formData.get('taskId') as string || ''
    const noteType = formData.get('noteType') as string || 'General'
    const transcription = formData.get('transcription') as string || ''

    if (!audioFile || !userId) {
      return NextResponse.json(
        { error: 'Audio file and user ID are required' },
        { status: 400 }
      )
    }

    // Convert file to base64 for Airtable attachment
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Create attachment object for Airtable
    const attachment = {
      url: `data:${audioFile.type};base64,${base64}`,
      filename: audioFile.name
    }

    // Get user name for linking
    const userResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      }
    })

    if (!userResponse.ok) {
      throw new Error('User not found')
    }

    const userData = await userResponse.json()
    const userName = userData.fields.Name

    // Create voice note record
    const noteFields: any = {
      User: [userName],
      'Audio URL': [attachment],
      Duration: 0, // Would need audio processing to get actual duration
      'Date Created': new Date().toISOString().split('T')[0],
      'Note Type': noteType,
      Transcription: transcription
    }

    if (taskId) {
      noteFields['Task ID'] = [taskId]
    }

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/VoiceNotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: noteFields
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const voiceNote = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Voice note uploaded successfully',
      voiceNote
    })
  } catch (error) {
    console.error('Voice note upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload voice note', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user name for filtering
    const userResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      }
    })

    if (!userResponse.ok) {
      throw new Error('User not found')
    }

    const userData = await userResponse.json()
    const userName = userData.fields.Name

    // Get voice notes for user
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/VoiceNotes?filterByFormula={User}="${userName}"&sort[0][field]=Date Created&sort[0][direction]=desc`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Process records to include audio URLs
    const voiceNotes = data.records.map((record: any) => ({
      id: record.id,
      ...record.fields,
      audio_url: record.fields['Audio URL']?.[0]?.url
    }))

    return NextResponse.json({
      success: true,
      voiceNotes
    })
  } catch (error) {
    console.error('Get voice notes error:', error)
    return NextResponse.json(
      { error: 'Failed to get voice notes' },
      { status: 500 }
    )
  }
}