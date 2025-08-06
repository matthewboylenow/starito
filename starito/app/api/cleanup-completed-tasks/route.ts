import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
const BASE_ID = process.env.AIRTABLE_BASE_ID!
const API_KEY = process.env.AIRTABLE_API_KEY!

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

async function airtableRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${AIRTABLE_API_URL}/${BASE_ID}/${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Airtable API error details:', errorBody)
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { date, force = false } = await request.json()
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    console.log('🧹 Starting cleanup of completed tasks for date:', targetDate)
    
    // Get all completed AND approved tasks for the specified date
    const formula = `AND({Completed}=TRUE(),{Approved}=TRUE(),{Date}="${targetDate}")`
    const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(formula)}`)
    
    const completedTasks = data.records || []
    console.log(`📋 Found ${completedTasks.length} completed tasks to cleanup`)
    
    if (completedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed tasks found to cleanup',
        tasksDeleted: 0,
        date: targetDate
      })
    }
    
    let deletedCount = 0
    const errors = []
    
    // Delete tasks in batches (Airtable allows max 10 per batch)
    const batchSize = 10
    for (let i = 0; i < completedTasks.length; i += batchSize) {
      const batch = completedTasks.slice(i, i + batchSize)
      const recordIds = batch.map((task: any) => task.id)
      
      try {
        // Delete batch of tasks
        const deleteUrl = `DailyTasks?${recordIds.map((id: string) => `records[]=${id}`).join('&')}`
        await airtableRequest(deleteUrl, {
          method: 'DELETE'
        })
        
        deletedCount += batch.length
        console.log(`✅ Deleted batch of ${batch.length} tasks`)
      } catch (error) {
        console.error(`❌ Failed to delete batch:`, error)
        errors.push(`Batch ${i / batchSize + 1}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    console.log(`🎉 Cleanup completed: ${deletedCount} tasks deleted`)
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} completed tasks`,
      tasksDeleted: deletedCount,
      totalFound: completedTasks.length,
      date: targetDate,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('❌ Cleanup completed tasks error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cleanup completed tasks', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}