import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    
    console.log('New push subscription:', subscription)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}