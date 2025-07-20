import { NextRequest, NextResponse } from 'next/server'
import { createTransaction, calculateUserStars, getUserById } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { userId, points, source } = await request.json()

    if (!userId || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'User ID and points amount are required' },
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

    // Create transaction record
    await createTransaction({
      User: [user.Name], // Use name since it links to Users.Name column
      Type: 'Manual',
      Points: points, // Can be positive or negative
      Source: source || `Manual adjustment: ${points > 0 ? 'bonus' : 'penalty'}`,
      Date: new Date().toISOString().split('T')[0]
    })

    // Calculate new total
    const newTotal = await calculateUserStars(userId)

    return NextResponse.json({
      success: true,
      newStarTotal: newTotal
    })
  } catch (error) {
    console.error('Adjust stars error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stars' },
      { status: 500 }
    )
  }
}