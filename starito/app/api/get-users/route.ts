import { NextResponse } from 'next/server'
import { getChildren } from '@/lib/airtable'

export async function GET() {
  try {
    const users = await getChildren()

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}