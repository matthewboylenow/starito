import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getUsers, getChildren } from '@/lib/airtable'

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
const BASE_ID = process.env.AIRTABLE_BASE_ID!
const API_KEY = process.env.AIRTABLE_API_KEY!

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

async function airtableRequest(endpoint: string) {
  const url = `${AIRTABLE_API_URL}/${BASE_ID}/${endpoint}`
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status}`)
  }
  return response.json()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userName = searchParams.get('userName')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    console.log('🐛 DEBUG ENDPOINT called with:', { userId, userName, date })

    // Get all users to see available data
    const allUsers = await getUsers()
    console.log('👥 All users in system:', allUsers.map(u => ({ id: u.id, name: u.Name, role: u.Role })))
    
    // Get all children specifically
    const children = await getChildren()
    console.log('👶 All children:', children.map(u => ({ id: u.id, name: u.Name, pin: u.PIN })))

    let targetUser = null
    
    if (userId) {
      targetUser = await getUserById(userId)
      console.log('👤 Target user by ID:', targetUser)
    } else if (userName) {
      targetUser = allUsers.find(u => u.Name === userName)
      console.log('👤 Target user by name:', targetUser)
    }

    // Get ALL DailyTasks regardless of filtering
    const allTasksData = await airtableRequest('DailyTasks')
    console.log('📋 ALL DailyTasks in Airtable:', allTasksData.records.length)
    
    // Show all unique date formats in the table
    const uniqueDates = [...new Set(allTasksData.records.map(r => r.fields.Date).filter(Boolean))]
    console.log('📅 All unique dates in DailyTasks table:', uniqueDates)
    
    // Show tasks for today specifically - try both date formats
    const todayTasksISO = allTasksData.records.filter(record => 
      record.fields.Date === date
    )
    console.log(`📅 Tasks for ${date} (ISO format):`, todayTasksISO.length)
    
    // Convert to M/D/YYYY format and try again
    const [year, month, day] = date.split('-')
    const formattedDate = `${parseInt(month)}/${parseInt(day)}/${year}`
    const todayTasksFormatted = allTasksData.records.filter(record => 
      record.fields.Date === formattedDate
    )
    console.log(`📅 Tasks for ${formattedDate} (M/D/YYYY format):`, todayTasksFormatted.length)
    
    const todayTasks = todayTasksFormatted.length > 0 ? todayTasksFormatted : todayTasksISO
    
    // Show detailed task info
    todayTasks.forEach(task => {
      console.log('📝 Task detail:', {
        id: task.id,
        user: task.fields.User,
        chore: task.fields.Chore,
        date: task.fields.Date,
        completed: task.fields.Completed,
        approved: task.fields.Approved
      })
    })

    // If we have a target user, show their specific tasks
    let userSpecificTasks = []
    if (targetUser) {
      userSpecificTasks = todayTasks.filter(task => 
        task.fields.User && task.fields.User.includes(targetUser.Name)
      )
      console.log(`🎯 Tasks specifically for ${targetUser.Name}:`, userSpecificTasks.length)
    }

    // Get all chores for reference
    const allChoresData = await airtableRequest('Chores')
    console.log('🧹 All chores:', allChoresData.records.map(c => ({
      title: c.fields.Title,
      active: c.fields.Active,
      stars: c.fields.Stars
    })))

    return NextResponse.json({
      success: true,
      debug: {
        allUsers: allUsers.map(u => ({ id: u.id, name: u.Name, role: u.Role })),
        children: children.map(u => ({ id: u.id, name: u.Name, pin: u.PIN })),
        targetUser,
        allTasksCount: allTasksData.records.length,
        todayTasksCount: todayTasks.length,
        todayTasks: todayTasks.map(task => ({
          id: task.id,
          user: task.fields.User,
          chore: task.fields.Chore,
          date: task.fields.Date,
          completed: task.fields.Completed,
          approved: task.fields.Approved
        })),
        userSpecificTasks: userSpecificTasks.map(task => ({
          id: task.id,
          user: task.fields.User,
          chore: task.fields.Chore,
          date: task.fields.Date,
          completed: task.fields.Completed,
          approved: task.fields.Approved
        })),
        allChores: allChoresData.records.map(c => ({
          title: c.fields.Title,
          active: c.fields.Active,
          stars: c.fields.Stars
        }))
      }
    })
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    )
  }
}