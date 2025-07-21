import { NextRequest, NextResponse } from 'next/server'
import { getActiveChores, getChildren, createDailyTask, getDailyTasksByUser } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Daily task reset started')
    
    // Get all active chores with Daily frequency
    const allChores = await getActiveChores()
    const dailyChores = allChores.filter(chore => chore.Frequency === 'Daily')
    
    // Get all children
    const children = await getChildren()
    
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`📅 Resetting daily tasks for ${today}`)
    console.log(`🧹 Found ${dailyChores.length} daily chores`)
    console.log(`👶 Found ${children.length} children`)
    
    let tasksCreated = 0
    let tasksSkipped = 0
    
    // Create tasks for each child and each daily chore
    for (const child of children) {
      for (const chore of dailyChores) {
        // Check if child is in the "Applies To" list for this chore
        if (!chore['Applies To'] || !chore['Applies To'].includes(child.Name)) {
          console.log(`⏭️ Skipping chore "${chore.Title}" for ${child.Name} (not in Applies To list)`)
          continue
        }
        
        // Check if task already exists for today
        const existingTasks = await getDailyTasksByUser(child.id, today)
        const existingTask = existingTasks.find(task => 
          task.Chore && task.Chore.includes(chore.Title)
        )
        
        if (existingTask) {
          console.log(`✅ Task already exists: ${chore.Title} for ${child.Name}`)
          tasksSkipped++
          continue
        }
        
        // Create new daily task
        const dailyTask = await createDailyTask({
          Date: today,
          User: [child.id],
          Chore: [chore.id],
          Completed: false,
          Approved: false,
          'Stars Earned': 0
        })
        
        console.log(`➕ Created task: ${chore.Title} for ${child.Name}`)
        tasksCreated++
      }
    }
    
    console.log('✅ Daily task reset completed')
    console.log(`📊 Created: ${tasksCreated}, Skipped: ${tasksSkipped}`)
    
    return NextResponse.json({
      success: true,
      date: today,
      tasksCreated,
      tasksSkipped,
      dailyChoresCount: dailyChores.length,
      childrenCount: children.length
    })
  } catch (error) {
    console.error('❌ Daily task reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset daily tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}