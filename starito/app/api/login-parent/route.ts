import { NextRequest, NextResponse } from 'next/server'
import { getParentByCredentials } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const parent = await getParentByCredentials(username, password)

    if (!parent) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.Name,
        username: parent.Username,
      }
    })
  } catch (error) {
    console.error('Parent login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}