import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
const BASE_ID = process.env.AIRTABLE_BASE_ID!
const API_KEY = process.env.AIRTABLE_API_KEY!

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

export async function PATCH(request: NextRequest) {
  try {
    const { rewardId, name, cost, maxUsesPerDay, available } = await request.json()

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.Name = name
    if (cost !== undefined) updateData.Cost = parseInt(cost)
    if (maxUsesPerDay !== undefined) updateData['Max Uses/Day'] = parseInt(maxUsesPerDay)
    if (available !== undefined) updateData.Available = available

    const url = `${AIRTABLE_API_URL}/${BASE_ID}/Rewards/${rewardId}`
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: updateData
      })
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    const updatedReward = await response.json()

    return NextResponse.json({
      success: true,
      reward: {
        id: updatedReward.id,
        ...updatedReward.fields
      }
    })
  } catch (error) {
    console.error('Update reward error:', error)
    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    )
  }
}