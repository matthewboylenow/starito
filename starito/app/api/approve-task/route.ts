import { NextRequest, NextResponse } from 'next/server'
import { updateDailyTask, createTransaction, getActiveChores, updateUserStreak, checkAndAwardAchievements } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { taskId, approved, parentNotes, starsAwarded } = await request.json()

    if (!taskId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Task ID and approval status are required' },
        { status: 400 }
      )
    }

    // Get the task details first to extract chore info
    const taskResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/DailyTasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      }
    })
    
    if (!taskResponse.ok) {
      throw new Error('Failed to fetch task details')
    }
    
    const taskData = await taskResponse.json()
    
    // Auto-calculate stars from chore if not explicitly provided
    let finalStarsAwarded = starsAwarded
    if (approved && !starsAwarded && taskData.fields.Chore && taskData.fields.Chore.length > 0) {
      const chores = await getActiveChores()
      const choreId = taskData.fields.Chore[0]
      const chore = chores.find(c => c.id === choreId)
      if (chore) {
        finalStarsAwarded = chore.Stars
        console.log(`📝 Auto-awarded ${chore.Stars} stars from chore: ${chore.Title}`)
      }
    }

    // Update the task with new boolean values according to schema
    const updates: any = {
      Approved: approved,
      'Stars Earned': approved && finalStarsAwarded ? finalStarsAwarded : 0
    }

    const updatedTask = await updateDailyTask(taskId, updates)

    // If approved and stars awarded, create transaction
    if (approved && finalStarsAwarded && updatedTask.User && updatedTask.User.length > 0) {
      const userName = updatedTask.User[0] // Get user name from linked field
      
      // Get chore title for better transaction description
      let choreTitle = 'Task'
      if (taskData.fields.Chore && taskData.fields.Chore.length > 0) {
        const chores = await getActiveChores()
        const choreId = taskData.fields.Chore[0]
        const chore = chores.find(c => c.id === choreId)
        if (chore) {
          choreTitle = chore.Title
        }
      }
      
      await createTransaction({
        User: [userName], // Use the name directly since it links to Users.Name column
        Type: 'Earned',
        Points: finalStarsAwarded,
        Source: `Completed: ${choreTitle}${parentNotes ? ` - ${parentNotes}` : ''}`,
        Date: new Date().toISOString().split('T')[0]
      })
      
      console.log(`⭐ Created transaction: ${finalStarsAwarded} stars for ${userName} - ${choreTitle}`)
      
      // Update user streak and check achievements when task is approved
      if (updatedTask.User && updatedTask.User.length > 0) {
        // Get user ID from the updated task
        const userResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users?filterByFormula={Name}="${userName}"`, {
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.records && userData.records.length > 0) {
            const userId = userData.records[0].id
            const taskDate = updatedTask.Date || new Date().toISOString().split('T')[0]
            
            // Update streak
            await updateUserStreak(userId, true, taskDate)
            
            // Check for new achievements
            const newAchievements = await checkAndAwardAchievements(userId)
            
            return NextResponse.json({
              success: true,
              task: updatedTask,
              starsAwarded: finalStarsAwarded,
              newAchievements: newAchievements.length > 0 ? newAchievements : undefined
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      starsAwarded: finalStarsAwarded
    })
  } catch (error) {
    console.error('Approve task error:', error)
    return NextResponse.json(
      { error: 'Failed to approve task' },
      { status: 500 }
    )
  }
}