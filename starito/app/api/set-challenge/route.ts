import { NextRequest, NextResponse } from 'next/server'
import { createChallenge } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, targetStars, bonusStars, endDate } = await request.json()

    if (!userId || !title || !targetStars || !endDate) {
      return NextResponse.json(
        { error: 'User ID, title, target stars, and end date are required' },
        { status: 400 }
      )
    }

    const challenge = await createChallenge({
      Description: description || '',
      'Bonus Stars': bonusStars || 0,
      'Active Today': true,
      'Applies To': [userId],
      Expiration: endDate
    })

    return NextResponse.json({
      success: true,
      challenge
    })
  } catch (error) {
    console.error('Set challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}