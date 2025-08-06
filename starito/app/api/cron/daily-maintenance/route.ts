import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🕒 Daily maintenance cron job started')
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const results = {
      dailyTasksCreated: null as any,
      weeklyTasksCreated: null as any,
      completedTasksCleanup: null as any,
      timestamp: new Date().toISOString()
    }
    
    // 1. Create new daily tasks
    try {
      console.log('📋 Creating daily tasks...')
      const dailyResponse = await fetch(`${baseUrl}/api/reset-daily-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (dailyResponse.ok) {
        results.dailyTasksCreated = await dailyResponse.json()
        console.log('✅ Daily tasks created:', results.dailyTasksCreated)
      } else {
        console.error('❌ Failed to create daily tasks:', await dailyResponse.text())
      }
    } catch (error) {
      console.error('❌ Daily task creation error:', error)
      results.dailyTasksCreated = { error: error instanceof Error ? error.message : String(error) }
    }
    
    // 2. Create weekly tasks (if it's Sunday)
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 0) { // Sunday
      try {
        console.log('📅 Creating weekly tasks (Sunday)...')
        const weeklyResponse = await fetch(`${baseUrl}/api/reset-weekly-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (weeklyResponse.ok) {
          results.weeklyTasksCreated = await weeklyResponse.json()
          console.log('✅ Weekly tasks created:', results.weeklyTasksCreated)
        } else {
          console.error('❌ Failed to create weekly tasks:', await weeklyResponse.text())
        }
      } catch (error) {
        console.error('❌ Weekly task creation error:', error)
        results.weeklyTasksCreated = { error: error instanceof Error ? error.message : String(error) }
      }
    } else {
      console.log('⏭️ Not Sunday, skipping weekly tasks')
      results.weeklyTasksCreated = { skipped: true, reason: 'Not Sunday' }
    }
    
    // 3. Clean up completed tasks from yesterday
    try {
      console.log('🧹 Cleaning up completed tasks from yesterday...')
      const cleanupResponse = await fetch(`${baseUrl}/api/cleanup-completed-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: yesterday })
      })
      
      if (cleanupResponse.ok) {
        results.completedTasksCleanup = await cleanupResponse.json()
        console.log('✅ Cleanup completed:', results.completedTasksCleanup)
      } else {
        console.error('❌ Failed to cleanup tasks:', await cleanupResponse.text())
      }
    } catch (error) {
      console.error('❌ Task cleanup error:', error)
      results.completedTasksCleanup = { error: error instanceof Error ? error.message : String(error) }
    }
    
    console.log('🎉 Daily maintenance completed')
    
    return NextResponse.json({
      success: true,
      message: 'Daily maintenance completed',
      results
    })
  } catch (error) {
    console.error('❌ Daily maintenance error:', error)
    return NextResponse.json(
      { 
        error: 'Daily maintenance failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}