import { User, Parent, Chore, DailyTask, Challenge, Reward, Transaction, UserStreak, Achievement, UserStats } from './types'

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

function transformRecord<T>(record: any): T & { id: string } {
  const fields = { ...record.fields }
  
  // Process Avatar URL if it's an attachment field
  if (fields['Avatar URL'] && Array.isArray(fields['Avatar URL']) && fields['Avatar URL'].length > 0) {
    fields.avatar_url = fields['Avatar URL'][0].url
  } else {
    fields.avatar_url = undefined
  }
  
  // Process Photo URL if it's an attachment field
  if (fields['Photo URL'] && Array.isArray(fields['Photo URL']) && fields['Photo URL'].length > 0) {
    fields.photo_url = fields['Photo URL'][0].url
  } else {
    fields.photo_url = undefined
  }
  
  return {
    id: record.id,
    ...fields,
  }
}

export async function getUsers(): Promise<User[]> {
  const data = await airtableRequest('Users')
  return data.records.map(transformRecord)
}

export async function getChildren(): Promise<User[]> {
  const data = await airtableRequest('Users?filterByFormula={Role}="Child"')
  return data.records.map(transformRecord)
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const data = await airtableRequest(`Users/${id}`)
    return transformRecord(data)
  } catch {
    return null
  }
}

export async function getUserByPin(pin: string): Promise<User | null> {
  const data = await airtableRequest(`Users?filterByFormula=AND({PIN}="${pin}",{Role}="Child")`)
  const records = data.records
  return records.length > 0 ? transformRecord(records[0]) : null
}

export async function getParentByCredentials(username: string, password: string): Promise<User | null> {
  const data = await airtableRequest(`Users?filterByFormula=AND({Username}="${username}",{Password}="${password}",{Role}="Parent")`)
  const records = data.records
  return records.length > 0 ? transformRecord(records[0]) : null
}

export async function getDailyTasksByUser(userId: string, date?: string): Promise<DailyTask[]> {
  console.log('🔍 getDailyTasksByUser called with:', { userId, date })
  
  // Get the user's name since DailyTasks.User links to Users.Name column
  const user = await getUserById(userId)
  console.log('👤 User lookup result:', user)
  
  if (!user) {
    console.log('❌ No user found for ID:', userId)
    return []
  }
  
  // If no date specified, default to TODAY only (changed behavior)
  const targetDate = date || new Date().toISOString().split('T')[0]
  console.log('📅 Using target date:', targetDate)
  
  // Try multiple date formats to find tasks
  const dateFormats = [
    targetDate, // ISO format: 2025-07-20
    targetDate.split('-').reverse().join('/'), // DD/MM/YYYY: 20/07/2025
    (() => { // M/D/YYYY: 7/20/2025
      const [year, month, day] = targetDate.split('-')
      return `${parseInt(month)}/${parseInt(day)}/${year}`
    })(),
    (() => { // MM/DD/YYYY: 07/20/2025
      const [year, month, day] = targetDate.split('-')
      return `${month}/${day}/${year}`
    })()
  ]
  
  console.log('🔍 Trying date formats for', targetDate, ':', dateFormats)
  
  for (const formattedDate of dateFormats) {
    const userFilter = `{User}="${user.Name}"`
    const dateFilter = `{Date}="${formattedDate}"`
    const formula = `AND(${userFilter},${dateFilter})`
    
    console.log('🔍 Airtable filter formula:', formula)
    
    const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(formula)}`)
    console.log('📊 Raw Airtable response for', formattedDate, ':', data)
    
    if (data.records && data.records.length > 0) {
      const tasks = data.records.map(transformRecord)
      console.log('✅ Found tasks with date format', formattedDate, ':', tasks)
      return tasks
    }
  }
  
  console.log('✅ No tasks found for date', targetDate)
  return []
}

export async function updateDailyTask(taskId: string, updates: Partial<DailyTask>): Promise<DailyTask> {
  const data = await airtableRequest(`DailyTasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: updates
    })
  })
  return transformRecord(data)
}

export async function getActiveChores(): Promise<Chore[]> {
  const data = await airtableRequest('Chores?filterByFormula={Active}=TRUE()')
  return data.records.map(transformRecord)
}

export async function getAvailableRewards(): Promise<Reward[]> {
  const data = await airtableRequest('Rewards?filterByFormula={Available}=TRUE()')
  return data.records.map(transformRecord)
}

export async function getActiveChallengesByUser(userId: string): Promise<Challenge[]> {
  // Get user name since Challenges.Applies To links to Users.Name column
  const user = await getUserById(userId)
  if (!user) return []
  
  const data = await airtableRequest(`Challenges?filterByFormula=AND(FIND("${user.Name}",{Applies To}),{Active Today}=TRUE())`)
  return data.records.map(transformRecord)
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const data = await airtableRequest('Transactions', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        ...transaction,
        Date: new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD for Date field
      }
    })
  })
  return transformRecord(data)
}

// Note: Star tracking is now handled through Transactions table
// This function creates a transaction record instead of updating user stars directly
export async function addStarsToUser(userId: string, points: number, source: string, type: 'Earned' | 'Redeemed' | 'Manual' = 'Manual'): Promise<Transaction> {
  // Get user name since Transactions.User links to Users.Name column
  const user = await getUserById(userId)
  if (!user) throw new Error('User not found')
  
  return createTransaction({
    User: [user.Name], // Use name since it links to Users.Name column
    Type: type,
    Points: points,
    Source: source,
    Date: new Date().toISOString().split('T')[0]
  })
}

export async function createDailyTask(task: Omit<DailyTask, 'id'>): Promise<DailyTask> {
  const data = await airtableRequest('DailyTasks', {
    method: 'POST',
    body: JSON.stringify({
      fields: task
    })
  })
  return transformRecord(data)
}

export async function createChallenge(challenge: Omit<Challenge, 'id'>): Promise<Challenge> {
  const data = await airtableRequest('Challenges', {
    method: 'POST',
    body: JSON.stringify({
      fields: challenge
    })
  })
  return transformRecord(data)
}

export async function createReward(reward: Omit<Reward, 'id' | 'created_at'>): Promise<Reward> {
  const data = await airtableRequest('Rewards', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        ...reward,
        created_at: new Date().toISOString()
      }
    })
  })
  return transformRecord(data)
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  // Get the user's name since Transactions.User links to Users.Name column
  const user = await getUserById(userId)
  if (!user) return []
  
  const data = await airtableRequest(`Transactions?filterByFormula=FIND("${user.Name}",{User})&sort[0][field]=Date&sort[0][direction]=desc`)
  return data.records.map(transformRecord)
}

export async function calculateUserStars(userId: string): Promise<number> {
  const transactions = await getTransactionsByUser(userId)
  return transactions.reduce((total, transaction) => total + transaction.Points, 0)
}

export async function getCompletedTasks(date?: string): Promise<DailyTask[]> {
  let formula = 'AND({Completed}=TRUE(),{Approved}=TRUE())'
  
  if (date) {
    // Try multiple date formats to match Airtable
    const dateFormats = [
      date, // ISO format: 2025-07-20
      date.split('-').reverse().join('/'), // DD/MM/YYYY: 20/07/2025
      (() => { // M/D/YYYY: 7/20/2025
        const [year, month, day] = date.split('-')
        return `${parseInt(month)}/${parseInt(day)}/${year}`
      })(),
      (() => { // MM/DD/YYYY: 07/20/2025
        const [year, month, day] = date.split('-')
        return `${month}/${day}/${year}`
      })()
    ]
    
    const dateConditions = dateFormats.map(dateFormat => `{Date}="${dateFormat}"`).join(',')
    formula = `AND({Completed}=TRUE(),{Approved}=TRUE(),OR(${dateConditions}))`
  }
  
  const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(formula)}`)
  return data.records.map(transformRecord)
}

export async function bulkDeleteTasks(taskIds: string[]): Promise<void> {
  const batchSize = 10 // Airtable batch limit
  
  for (let i = 0; i < taskIds.length; i += batchSize) {
    const batch = taskIds.slice(i, i + batchSize)
    const deleteUrl = `DailyTasks?${batch.map(id => `records[]=${id}`).join('&')}`
    await airtableRequest(deleteUrl, { method: 'DELETE' })
  }
}

// Streak tracking functions
export async function getUserStreak(userId: string, streakType: 'Daily' | 'Weekly' = 'Daily'): Promise<UserStreak | null> {
  const user = await getUserById(userId)
  if (!user) return null
  
  const data = await airtableRequest(`UserStreaks?filterByFormula=AND({User}="${user.Name}",{Streak Type}="${streakType}")`)
  const records = data.records
  return records.length > 0 ? transformRecord(records[0]) : null
}

export async function updateUserStreak(userId: string, completed: boolean, date: string = new Date().toISOString().split('T')[0]): Promise<UserStreak> {
  const user = await getUserById(userId)
  if (!user) throw new Error('User not found')
  
  let streak = await getUserStreak(userId, 'Daily')
  
  if (!streak) {
    // Create new streak record
    const streakData = await airtableRequest('UserStreaks', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          User: [user.Name],
          'Current Streak': completed ? 1 : 0,
          'Longest Streak': completed ? 1 : 0,
          'Last Completion Date': completed ? date : '',
          'Streak Type': 'Daily'
        }
      })
    })
    return transformRecord(streakData)
  }
  
  // Update existing streak
  const lastDate = streak['Last Completion Date']
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  let newStreak = streak['Current Streak']
  
  if (completed) {
    if (lastDate === yesterday) {
      // Continuing streak
      newStreak += 1
    } else if (lastDate === date) {
      // Same day, no change
      return streak
    } else {
      // Streak broken, restart
      newStreak = 1
    }
  } else {
    // No completion today - check if streak should be broken
    if (lastDate !== yesterday && lastDate !== date) {
      newStreak = 0
    }
  }
  
  const updatedStreak = await airtableRequest(`UserStreaks/${streak.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: {
        'Current Streak': newStreak,
        'Longest Streak': Math.max(newStreak, streak['Longest Streak']),
        'Last Completion Date': completed ? date : streak['Last Completion Date']
      }
    })
  })
  
  return transformRecord(updatedStreak)
}

// Achievement functions
export async function createAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement> {
  const data = await airtableRequest('Achievements', {
    method: 'POST',
    body: JSON.stringify({
      fields: achievement
    })
  })
  return transformRecord(data)
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const user = await getUserById(userId)
  if (!user) return []
  
  const data = await airtableRequest(`Achievements?filterByFormula=AND({User}="${user.Name}",{Visible}=TRUE())&sort[0][field]=Date Earned&sort[0][direction]=desc`)
  return data.records.map(transformRecord)
}

export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
  const user = await getUserById(userId)
  if (!user) return []
  
  const achievements: Achievement[] = []
  const streak = await getUserStreak(userId, 'Daily')
  const existingAchievements = await getUserAchievements(userId)
  
  // Check streak achievements
  if (streak && streak['Current Streak'] >= 7) {
    const hasWeekStreakBadge = existingAchievements.some(a => a['Badge Type'] === 'Streak' && a['Badge Name'] === '7-Day Streak')
    if (!hasWeekStreakBadge) {
      const badge = await createAchievement({
        User: [user.Name],
        'Badge Type': 'Streak',
        'Badge Name': '7-Day Streak',
        'Badge Description': 'Completed tasks for 7 days in a row!',
        'Badge Icon': '🔥',
        'Date Earned': new Date().toISOString().split('T')[0],
        Visible: true
      })
      achievements.push(badge)
    }
  }
  
  if (streak && streak['Current Streak'] >= 30) {
    const hasMonthStreakBadge = existingAchievements.some(a => a['Badge Type'] === 'Streak' && a['Badge Name'] === '30-Day Streak')
    if (!hasMonthStreakBadge) {
      const badge = await createAchievement({
        User: [user.Name],
        'Badge Type': 'Streak',
        'Badge Name': '30-Day Streak',
        'Badge Description': 'Completed tasks for 30 days in a row!',
        'Badge Icon': '🏆',
        'Date Earned': new Date().toISOString().split('T')[0],
        Visible: true
      })
      achievements.push(badge)
    }
  }
  
  // Check task completion achievements
  const transactions = await getTransactionsByUser(userId)
  const earnedTransactions = transactions.filter(t => t.Type === 'Earned')
  
  if (earnedTransactions.length >= 50) {
    const hasTaskMasterBadge = existingAchievements.some(a => a['Badge Type'] === 'Task Count' && a['Badge Name'] === 'Task Master')
    if (!hasTaskMasterBadge) {
      const badge = await createAchievement({
        User: [user.Name],
        'Badge Type': 'Task Count',
        'Badge Name': 'Task Master',
        'Badge Description': 'Completed 50 tasks!',
        'Badge Icon': '⭐',
        'Date Earned': new Date().toISOString().split('T')[0],
        Visible: true
      })
      achievements.push(badge)
    }
  }
  
  return achievements
}

// Analytics functions
export async function createUserStats(stats: Omit<UserStats, 'id'>): Promise<UserStats> {
  const data = await airtableRequest('UserStats', {
    method: 'POST',
    body: JSON.stringify({
      fields: stats
    })
  })
  return transformRecord(data)
}

export async function getUserStats(userId: string, days: number = 7): Promise<UserStats[]> {
  const user = await getUserById(userId)
  if (!user) return []
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const data = await airtableRequest(`UserStats?filterByFormula=AND({User}="${user.Name}",IS_AFTER({Date},"${startDate}"))&sort[0][field]=Date&sort[0][direction]=desc`)
  return data.records.map(transformRecord)
}