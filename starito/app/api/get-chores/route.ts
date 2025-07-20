import { NextResponse } from 'next/server'
import { getActiveChores } from '@/lib/airtable'

export async function GET() {
  try {
    const chores = await getActiveChores()

    return NextResponse.json({
      success: true,
      chores
    })
  } catch (error) {
    console.error('Get chores error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    )
  }
}