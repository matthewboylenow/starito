import { NextResponse } from 'next/server'
import { getChildren } from '@/lib/airtable'

export async function GET() {
  try {
    const children = await getChildren()
    
    // Return user data with only necessary fields for kid selection
    const kids = children.map(user => ({
      id: user.id,
      name: user.Name, // Use the correct Airtable field name
      avatar_url: user.avatar_url, // This is transformed in airtable.ts
    }))
    
    return NextResponse.json({
      success: true,
      kids
    })
  } catch (error) {
    console.error('Error fetching kids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kids' },
      { status: 500 }
    )
  }
}