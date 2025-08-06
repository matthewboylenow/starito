import { NextRequest, NextResponse } from 'next/server'
import { getUserAchievements, checkAndAwardAchievements } from '@/lib/airtable'

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

    const achievements = await getUserAchievements(userId)

    return NextResponse.json({
      success: true,
      achievements
    })
  } catch (error) {
    console.error('Get user achievements error:', error)
    return NextResponse.json(
      { error: 'Failed to get achievements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const newAchievements = await checkAndAwardAchievements(userId)

    return NextResponse.json({
      success: true,
      newAchievements
    })
  } catch (error) {
    console.error('Check achievements error:', error)
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    )
  }
}