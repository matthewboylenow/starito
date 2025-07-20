import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get all challenges (not filtered by user since this is for parent view)
    const data = await airtableRequest('Challenges')
    const challenges = data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }))

    return NextResponse.json({
      success: true,
      challenges
    })
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// Local airtableRequest function
async function airtableRequest(endpoint: string, options: RequestInit = {}) {
  const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
  const BASE_ID = process.env.AIRTABLE_BASE_ID!
  const API_KEY = process.env.AIRTABLE_API_KEY!

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  const url = `${AIRTABLE_API_URL}/${BASE_ID}/${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}