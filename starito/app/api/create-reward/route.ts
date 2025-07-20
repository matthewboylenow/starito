import { NextRequest, NextResponse } from 'next/server'
import { createReward } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { name, cost, maxUsesPerDay, available = true } = await request.json()

    if (!name || !cost) {
      return NextResponse.json(
        { error: 'Name and cost are required' },
        { status: 400 }
      )
    }

    const rewardData: any = {
      Name: name,
      Cost: parseInt(cost),
      Available: available
    }

    if (maxUsesPerDay) {
      rewardData['Max Uses/Day'] = parseInt(maxUsesPerDay)
    }

    const reward = await createReward(rewardData)

    return NextResponse.json({
      success: true,
      reward
    })
  } catch (error) {
    console.error('Create reward error:', error)
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    )
  }
}