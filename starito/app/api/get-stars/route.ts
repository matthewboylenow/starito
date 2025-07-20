import { NextRequest, NextResponse } from 'next/server'
import { calculateUserStars } from '@/lib/airtable'

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

    const totalStars = await calculateUserStars(userId)

    return NextResponse.json({
      success: true,
      stars: totalStars
    })
  } catch (error) {
    console.error('Get stars error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate stars' },
      { status: 500 }
    )
  }
}