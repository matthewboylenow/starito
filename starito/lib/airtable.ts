import { User, Parent, Chore, DailyTask, Challenge, Reward, Transaction } from './types'

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
  
  // If no date specified, get all tasks for the user
  if (!date) {
    const userFilter = `{User}="${user.Name}"`
    console.log('🔍 Airtable filter formula (no date):', userFilter)
    
    const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(userFilter)}`)
    console.log('📊 Raw Airtable response:', data)
    
    const tasks = data.records.map(transformRecord)
    console.log('✅ Transformed tasks:', tasks)
    return tasks
  }
  
  // Try multiple date formats to find tasks
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
  
  console.log('🔍 Trying date formats:', dateFormats)
  
  for (const formattedDate of dateFormats) {
    const userFilter = `{User}="${user.Name}"`
    const dateFilter = `{Date}="${formattedDate}"`
    const formula = `AND(${userFilter},${dateFilter})`
    
    console.log('🔍 Airtable filter formula:', formula)
    console.log('🔍 Full request URL:', `DailyTasks?filterByFormula=${encodeURIComponent(formula)}`)
    
    const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(formula)}`)
    console.log('📊 Raw Airtable response for', formattedDate, ':', data)
    
    if (data.records && data.records.length > 0) {
      const tasks = data.records.map(transformRecord)
      console.log('✅ Found tasks with date format', formattedDate, ':', tasks)
      return tasks
    }
  }
  
  // If no tasks found for the specific date, check if there are any tasks at all for this user
  console.log('🔍 No tasks found for specific date, checking all tasks for user...')
  const userFilter = `{User}="${user.Name}"`
  const data = await airtableRequest(`DailyTasks?filterByFormula=${encodeURIComponent(userFilter)}`)
  console.log('📊 All tasks for user:', data)
  
  const tasks = data.records.map(transformRecord)
  console.log('✅ All user tasks (no date filter):', tasks)
  
  return tasks
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