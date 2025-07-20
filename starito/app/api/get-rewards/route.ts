import { NextResponse } from 'next/server'
import { getAvailableRewards } from '@/lib/airtable'

export async function GET() {
  try {
    const rewards = await getAvailableRewards()

    return NextResponse.json({
      success: true,
      rewards
    })
  } catch (error) {
    console.error('Get rewards error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}