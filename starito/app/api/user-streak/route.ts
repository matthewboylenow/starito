import { NextRequest, NextResponse } from 'next/server'
import { getUserStreak, updateUserStreak, checkAndAwardAchievements } from '@/lib/airtable'

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

    const streak = await getUserStreak(userId, 'Daily')

    return NextResponse.json({
      success: true,
      streak
    })
  } catch (error) {
    console.error('Get user streak error:', error)
    return NextResponse.json(
      { error: 'Failed to get streak' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, completed, date } = await request.json()

    if (!userId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and completion status are required' },
        { status: 400 }
      )
    }

    const streak = await updateUserStreak(userId, completed, date)
    
    // Check for new achievements
    const newAchievements = await checkAndAwardAchievements(userId)

    return NextResponse.json({
      success: true,
      streak,
      newAchievements
    })
  } catch (error) {
    console.error('Update user streak error:', error)
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    )
  }
}