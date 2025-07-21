import { NextRequest, NextResponse } from 'next/server'
import { getActiveChores, getChildren, createDailyTask, getDailyTasksByUser } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Weekly task reset started')
    
    // Verify it's Sunday (0 = Sunday in JS)
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    if (dayOfWeek !== 0) {
      console.log(`⏭️ Not Sunday (day ${dayOfWeek}), skipping weekly reset`)
      return NextResponse.json({
        success: false,
        message: 'Weekly reset only runs on Sundays',
        dayOfWeek
      })
    }
    
    // Get all active chores with Weekly frequency
    const allChores = await getActiveChores()
    const weeklyChores = allChores.filter(chore => chore.Frequency === 'Weekly')
    
    // Get all children
    const children = await getChildren()
    
    const todayStr = today.toISOString().split('T')[0]
    
    console.log(`📅 Resetting weekly tasks for ${todayStr} (Sunday)`)
    console.log(`🧹 Found ${weeklyChores.length} weekly chores`)
    console.log(`👶 Found ${children.length} children`)
    
    let tasksCreated = 0
    let tasksSkipped = 0
    
    // Create tasks for each child and each weekly chore
    for (const child of children) {
      for (const chore of weeklyChores) {
        // Check if child is in the "Applies To" list for this chore
        if (!chore['Applies To'] || !chore['Applies To'].includes(child.Name)) {
          console.log(`⏭️ Skipping chore "${chore.Title}" for ${child.Name} (not in Applies To list)`)
          continue
        }
        
        // Check if task already exists for today
        const existingTasks = await getDailyTasksByUser(child.id, todayStr)
        const existingTask = existingTasks.find(task => 
          task.Chore && task.Chore.includes(chore.Title)
        )
        
        if (existingTask) {
          console.log(`✅ Task already exists: ${chore.Title} for ${child.Name}`)
          tasksSkipped++
          continue
        }
        
        // Create new weekly task
        const dailyTask = await createDailyTask({
          Date: todayStr,
          User: [child.id],
          Chore: [chore.id],
          Completed: false,
          Approved: false,
          'Stars Earned': 0
        })
        
        console.log(`➕ Created weekly task: ${chore.Title} for ${child.Name}`)
        tasksCreated++
      }
    }
    
    console.log('✅ Weekly task reset completed')
    console.log(`📊 Created: ${tasksCreated}, Skipped: ${tasksSkipped}`)
    
    return NextResponse.json({
      success: true,
      date: todayStr,
      dayOfWeek,
      tasksCreated,
      tasksSkipped,
      weeklyChoresCount: weeklyChores.length,
      childrenCount: children.length
    })
  } catch (error) {
    console.error('❌ Weekly task reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset weekly tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}