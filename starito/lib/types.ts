// Base interfaces matching exact Airtable schema from AIRTABLE_SCHEMA.md

export interface User {
  id: string // Airtable record ID
  Name: string // Display name of the user
  Role: 'Child' | 'Parent' | 'Guardian' | 'Caregiver' // Extended roles
  PIN?: string // 4-digit PIN for child login
  Username?: string // Used for parent login
  Password?: string // Used for parent login
  'Avatar URL'?: any[] // Attachment field - optional image for splash login
  avatar_url?: string // Processed avatar URL (transformed in airtable.ts)
  Family: string[] // Links to Families table
  'Permission Level': 'Admin' | 'Standard' | 'ReadOnly' // For non-child users
  'Last Login': string // Track last login date
  Active: boolean // Whether account is active
}

export interface Chore {
  id: string // Airtable record ID
  Title: string // Name of the chore
  Stars: number // Points awarded for completion
  Frequency: 'Daily' | 'Weekly' | 'One-time' // Daily, Weekly, or One-time
  Required: boolean // Whether it's a required task
  'Applies To': string[] // Links to Users table
  Active: boolean // Whether chore is currently active
  Difficulty: 'Easy' | 'Medium' | 'Hard' // Difficulty level
  'Photo Required': boolean // Whether photo proof is required
  'Time Estimate': number // Estimated minutes to complete
  Description?: string // Optional detailed description
  'Bonus Multiplier': number // Multiplier for bonus rewards (default 1.0)
}

export interface DailyTask {
  id: string // Airtable record ID
  Date: string // When the task is assigned
  User: string[] // Links to Users table
  Chore: string[] // Links to Chores table
  Completed: boolean // Whether the child marked it done
  Approved: boolean // Whether parent approved it
  'Stars Earned': number // Final awarded points
  'Photo URL'?: any[] // Attachment field - optional photo proof
  'Photo Notes'?: string // Optional notes about the photo
  photo_url?: string // Processed photo URL (transformed in airtable.ts)
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

// Streak tracking interface
export interface UserStreak {
  id: string // Airtable record ID
  User: string[] // Links to Users table
  'Current Streak': number // Days of consecutive completion
  'Longest Streak': number // Best streak ever
  'Last Completion Date': string // Last date tasks were completed
  'Streak Type': 'Daily' | 'Weekly' // Type of streak being tracked
}

// Achievement badges interface
export interface Achievement {
  id: string // Airtable record ID
  User: string[] // Links to Users table
  'Badge Type': 'Streak' | 'Task Count' | 'Stars Earned' | 'Special' // Category of achievement
  'Badge Name': string // Name of the badge
  'Badge Description': string // What was accomplished
  'Badge Icon': string // Emoji or icon for the badge
  'Date Earned': string // When the badge was earned
  Visible: boolean // Whether to show on profile
}

// Analytics interface
export interface UserStats {
  id: string
  User: string[]
  Date: string
  'Tasks Completed': number
  'Tasks Assigned': number
  'Completion Rate': number // Percentage
  'Stars Earned': number
  'Time Spent': number // Minutes (optional)
}

// Family/Household management
export interface Family {
  id: string // Airtable record ID
  'Family Name': string // Name of the family/household
  'Invite Code': string // Code for joining the family
  'Created Date': string // When family was created
  'Settings': string // JSON string of family settings
  Active: boolean // Whether family is active
}

// Voice notes interface
export interface VoiceNote {
  id: string // Airtable record ID
  User: string[] // Links to Users table
  'Task ID': string[] // Links to DailyTasks table (optional)
  'Audio URL': any[] // Attachment field - audio file
  'Duration': number // Length in seconds
  'Transcription': string // Auto-generated text (optional)
  'Date Created': string // When note was recorded
  'Note Type': 'Task Update' | 'General' | 'Help Request' // Category
  audio_url?: string // Processed audio URL
}

// Offline mode support
export interface OfflineAction {
  id: string
  type: 'task_complete' | 'task_submit' | 'photo_upload' | 'voice_note'
  payload: any
  timestamp: string
  synced: boolean
}

// Legacy interface for backward compatibility
export interface Parent {
  id: string
  username: string
  password: string
}