import { NextRequest, NextResponse } from 'next/server'
import { getUserByPin, getUserById } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { pin, kidId } = await request.json()

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      )
    }

    let user;
    
    if (kidId) {
      // If kidId is provided, verify the PIN belongs to the selected kid
      user = await getUserById(kidId)
      
      if (!user || user.PIN !== pin) {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 401 }
        )
      }
    } else {
      // Fallback to original behavior for backward compatibility
      user = await getUserByPin(pin)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        Name: user.Name,
        avatar_url: user.avatar_url,
      }
    })
  } catch (error) {
    console.error('Child login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}