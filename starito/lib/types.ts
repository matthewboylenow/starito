// Base interfaces matching exact Airtable schema from AIRTABLE_SCHEMA.md

export interface User {
  id: string // Airtable record ID
  Name: string // Display name of the user
  Role: 'Child' | 'Parent' // "Child" or "Parent"
  PIN?: string // 4-digit PIN for child login
  Username?: string // Used for parent login
  Password?: string // Used for parent login
  'Avatar URL'?: any[] // Attachment field - optional image for splash login
  avatar_url?: string // Processed avatar URL (transformed in airtable.ts)
}

export interface Chore {
  id: string // Airtable record ID
  Title: string // Name of the chore
  Stars: number // Points awarded for completion
  Frequency: 'Daily' | 'Weekly' | 'One-time' // Daily, Weekly, or One-time
  Required: boolean // Whether it's a required task
  'Applies To': string[] // Links to Users table
  Active: boolean // Whether chore is currently active
}

export interface DailyTask {
  id: string // Airtable record ID
  Date: string // When the task is assigned
  User: string[] // Links to Users table
  Chore: string[] // Links to Chores table
  Completed: boolean // Whether the child marked it done
  Approved: boolean // Whether parent approved it
  'Stars Earned': number // Final awarded points
}

export interface Challenge {
  id: string // Airtable record ID
  Description: string // Description of the challenge
  'Bonus Stars': number // Additional points awarded
  'Active Today': boolean // Whether it is currently featured
  'Applies To': string[] // Links to Users or Chores
  Expiration?: string // Optional expiration date
}

export interface Reward {
  id: string // Airtable record ID
  Name: string // Name of the reward
  Cost: number // Point cost to redeem
  'Max Uses/Day'?: number // Optional limit per day
  Available: boolean // Whether reward is currently redeemable
}

export interface Transaction {
  id: string // Airtable record ID
  Date: string // Date of transaction
  User: string[] // Links to Users table
  Type: 'Earned' | 'Redeemed' | 'Manual' // Earned, Redeemed, or Manual
  Points: number // Positive or negative points
  Source: string // Description or chore/reward name
}

// Extended interfaces for frontend use
export interface DailyTaskWithStatus extends DailyTask {
  status: 'assigned' | 'submitted' | 'approved' | 'rejected' // Computed from Completed/Approved fields
  chore?: Chore // Populated chore data
  user?: User // Populated user data (used in all-tasks view)
}

export interface UserWithStars extends User {
  totalStars?: number // Computed total stars from transactions
}

// Legacy interface for backward compatibility
export interface Parent {
  id: string
  username: string
  password: string
}