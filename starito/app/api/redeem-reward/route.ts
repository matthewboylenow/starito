import { NextRequest, NextResponse } from 'next/server'
import { calculateUserStars, createTransaction, getUserById } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { userId, rewardId, rewardName, starCost } = await request.json()

    if (!userId || !rewardId || !starCost) {
      return NextResponse.json(
        { error: 'User ID, reward ID, and star cost are required' },
        { status: 400 }
      )
    }

    // Get user name since Transactions.User links to Users.Name column
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check current star balance
    const currentStars = await calculateUserStars(userId)

    if (currentStars < starCost) {
      return NextResponse.json(
        { error: 'Insufficient stars' },
        { status: 400 }
      )
    }

    // Create negative transaction for redemption
    await createTransaction({
      User: [user.Name], // Use name since it links to Users.Name column
      Type: 'Redeemed',
      Points: -starCost, // Negative to deduct stars
      Source: `Redeemed reward: ${rewardName}`,
      Date: new Date().toISOString().split('T')[0]
    })

    const newTotal = currentStars - starCost

    return NextResponse.json({
      success: true,
      newStarTotal: newTotal
    })
  } catch (error) {
    console.error('Redeem reward error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}