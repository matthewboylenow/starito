# 🚀 Starito Production Deployment Guide

Complete step-by-step guide to deploy Starito to production with all pro features enabled.

## 📋 Table of Contents
1. [Airtable Schema Setup](#1-airtable-schema-setup)
2. [Cron Jobs (Vercel Cron)](#2-cron-jobs-vercel-cron)
3. [Push Notifications (Free Options)](#3-push-notifications-free-options)
4. [Error Monitoring (Free Tier)](#4-error-monitoring-free-tier)
5. [Analytics Setup](#5-analytics-setup)
6. [CDN Configuration](#6-cdn-configuration)
7. [Backup Strategy](#7-backup-strategy)
8. [Environment Variables](#8-environment-variables)
9. [Testing Checklist](#9-testing-checklist)
10. [Go-Live Steps](#10-go-live-steps)

---

## 1. 📊 Airtable Schema Setup

### Step 1.1: Create New Tables

#### A. UserStreaks Table
```
Table Name: UserStreaks
Fields:
- User (Link to another record → Users, Display Name)
- Current Streak (Number)
- Longest Streak (Number) 
- Last Completion Date (Date)
- Streak Type (Single select: Daily, Weekly)
```

#### B. Achievements Table  
```
Table Name: Achievements
Fields:
- User (Link to another record → Users, Display Name)
- Badge Type (Single select: Streak, Task Count, Stars Earned, Special)
- Badge Name (Single line text)
- Badge Description (Long text)
- Badge Icon (Single line text)
- Date Earned (Date)
- Visible (Checkbox, default: checked)
```

#### C. UserStats Table
```
Table Name: UserStats  
Fields:
- User (Link to another record → Users, Display Name)
- Date (Date)
- Tasks Completed (Number)
- Tasks Assigned (Number) 
- Completion Rate (Number)
- Stars Earned (Number)
- Time Spent (Number)
```

#### D. Families Table
```
Table Name: Families
Fields:
- Family Name (Single line text)
- Invite Code (Single line text)
- Created Date (Date)
- Settings (Long text)
- Active (Checkbox, default: checked)
```

#### E. VoiceNotes Table
```
Table Name: VoiceNotes
Fields:
- User (Link to another record → Users, Display Name)
- Task ID (Link to another record → DailyTasks, optional)
- Audio URL (Attachment)
- Duration (Number) 
- Transcription (Long text)
- Date Created (Date)
- Note Type (Single select: Task Update, General, Help Request)
```

### Step 1.2: Update Existing Tables

#### A. Update Users Table
Add these new fields:
```
- Family (Link to another record → Families)
- Permission Level (Single select: Admin, Standard, ReadOnly)
- Last Login (Date)
- Active (Checkbox, default: checked)
- Role (Update existing: Child, Parent, Guardian, Caregiver)
```

#### B. Update Chores Table  
Add these new fields:
```
- Difficulty (Single select: Easy, Medium, Hard)
- Photo Required (Checkbox)
- Time Estimate (Number)
- Description (Long text)
- Bonus Multiplier (Number, default: 1.0)
```

#### C. Update DailyTasks Table
Add these new fields:
```
- Photo URL (Attachment)
- Photo Notes (Long text)
```

### Step 1.3: Verify Airtable API Access
1. Go to https://airtable.com/create/tokens
2. Create a personal access token with:
   - `data.records:read` 
   - `data.records:write`
   - Access to your base
3. Test API access with a simple curl command:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
https://api.airtable.com/v0/YOUR_BASE_ID/Users
```

---

## 2. ⏰ Cron Jobs (Vercel Cron)

### Step 2.1: Install Vercel CLI
```bash
npm i -g vercel@latest
vercel login
```

### Step 2.2: Create Vercel Cron Configuration
Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-maintenance",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Step 2.3: Deploy to Vercel
```bash
vercel --prod
```

### Step 2.4: Verify Cron Job Setup
1. Go to Vercel Dashboard → Your Project → Functions tab
2. Look for "Cron Jobs" section
3. Verify the daily maintenance job is listed
4. Test manually: `curl -X POST https://yourapp.vercel.app/api/cron/daily-maintenance`

### Step 2.5: Alternative: Manual Cron Setup (if not using Vercel Pro)
If you're on Vercel hobby plan, set up external cron:

#### Option A: GitHub Actions (Free)
Create `.github/workflows/daily-cron.yml`:
```yaml
name: Daily Maintenance
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  daily-maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Maintenance
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            https://yourapp.vercel.app/api/cron/daily-maintenance
```

#### Option B: EasyCron.com (Free tier: 1 job)
1. Sign up at https://www.easycron.com/
2. Create new cron job:
   - URL: `https://yourapp.vercel.app/api/cron/daily-maintenance`
   - Method: POST
   - Schedule: `0 6 * * *`

---

## 3. 📱 Push Notifications (Free Options)

### Option A: Firebase Cloud Messaging (Recommended - Free)

#### Step 3.1: Setup Firebase Project
1. Go to https://console.firebase.google.com/
2. Create new project or select existing
3. Enable Cloud Messaging

#### Step 3.2: Get Firebase Config
1. Project Settings → General → Your apps
2. Add web app, get config object
3. Project Settings → Cloud Messaging → Web Push certificates
4. Generate key pair, save the key

#### Step 3.3: Install Firebase SDK
```bash
npm install firebase
```

#### Step 3.4: Create Firebase Config
Create `lib/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  // Your config from Step 3.2
}

const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)
```

#### Step 3.5: Update Service Worker
Update `public/sw.js`:
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  // Your config
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message:', payload)
  const { title, body, icon } = payload.notification
  self.registration.showNotification(title, { body, icon })
})
```

#### Step 3.6: Update Push Notifications API
Update `app/api/push/send/route.ts` to use Firebase Admin SDK:
```bash
npm install firebase-admin
```

#### Step 3.7: Environment Variables for Firebase
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Option B: OneSignal (Alternative - Free tier: 10k notifications/month)

#### Step 3.1: Setup OneSignal
1. Sign up at https://onesignal.com/
2. Create new app
3. Choose Web Push → Site URL
4. Get App ID and REST API Key

#### Step 3.2: Install OneSignal
```bash
npm install react-onesignal
```

#### Step 3.3: Add OneSignal to Layout
```typescript
// In app/layout.tsx
import OneSignal from 'react-onesignal'

export default function RootLayout() {
  useEffect(() => {
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
    })
  }, [])
  // ...
}
```

---

## 4. 🚨 Error Monitoring (Free Tier)

### Option A: Sentry (Recommended - Free: 5k errors/month)

#### Step 4.1: Setup Sentry Account
1. Sign up at https://sentry.io/
2. Create new project → Next.js
3. Get your DSN

#### Step 4.2: Install Sentry
```bash
npx @sentry/wizard@latest -i nextjs
```

#### Step 4.3: Configure Sentry
The wizard creates `sentry.client.config.ts` and `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

#### Step 4.4: Add Custom Error Tracking
Update your API routes:
```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    Sentry.captureException(error)
    console.error('API Error:', error)
    // Handle error
  }
}
```

### Option B: LogRocket (Alternative - Free: 1k sessions/month)

#### Step 4.1: Setup LogRocket
1. Sign up at https://logrocket.com/
2. Get your App ID

#### Step 4.2: Install LogRocket
```bash
npm install logrocket logrocket-react
```

#### Step 4.3: Initialize LogRocket
```typescript
// In app/layout.tsx
import LogRocket from 'logrocket'
import setupLogRocketReact from 'logrocket-react'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID!)
  setupLogRocketReact(LogRocket)
}
```

---

## 5. 📊 Analytics Setup

### Option A: Native Analytics (Recommended for Privacy)

#### Step 5.1: Create Analytics System
Create `lib/analytics.ts`:
```typescript
interface AnalyticsEvent {
  event: string
  userId?: string
  properties?: Record<string, any>
}

class Analytics {
  private queue: AnalyticsEvent[] = []
  
  track(event: string, properties?: Record<string, any>, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userAgent: navigator.userAgent
      }
    }
    
    this.queue.push(analyticsEvent)
    this.flush()
  }
  
  private async flush() {
    if (this.queue.length === 0) return
    
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [...this.queue] })
      })
      this.queue = []
    } catch (error) {
      console.error('Analytics flush failed:', error)
    }
  }
}

export const analytics = new Analytics()
```

#### Step 5.2: Create Analytics API
Create `app/api/analytics/track/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json()
    
    // Store in Airtable or your preferred database
    for (const event of events) {
      await storeAnalyticsEvent(event)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}
```

#### Step 5.3: Add Tracking Throughout App
```typescript
// Track key events
analytics.track('task_completed', { taskId, stars }, userId)
analytics.track('streak_milestone', { streak: 7 }, userId)
analytics.track('achievement_unlocked', { badge: 'Task Master' }, userId)
```

### Option B: Fathom Analytics (Privacy-focused - $14/month)

#### Step 5.1: Setup Fathom
1. Sign up at https://usefathom.com/
2. Add your site
3. Get tracking code

#### Step 5.2: Add Fathom Script
```typescript
// In app/layout.tsx
import Script from 'next/script'

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script 
          src="https://cdn.usefathom.com/script.js" 
          data-site="YOUR_SITE_ID"
          defer
        />
      </head>
      {/* ... */}
    </html>
  )
}
```

#### Step 5.3: Track Custom Events
```typescript
// Track custom events
declare global {
  interface Window {
    fathom?: {
      trackGoal: (goalId: string, cents: number) => void
    }
  }
}

// Usage
window.fathom?.trackGoal('TASK_COMPLETED', 0)
```

### Option C: Google Analytics 4 (Free)

#### Step 5.1: Create GA4 Property
1. Go to https://analytics.google.com/
2. Create new property
3. Get Measurement ID

#### Step 5.2: Install GA4
```bash
npm install gtag
```

#### Step 5.3: Add GA4 Script
```typescript
// In app/layout.tsx
import Script from 'next/script'

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script 
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      {/* ... */}
    </html>
  )
}
```

---

## 6. 🌐 CDN Configuration

### Option A: Vercel Edge Network (Included)
Vercel automatically provides CDN for static assets. No additional setup needed.

### Option B: Cloudflare (Free Tier)

#### Step 6.1: Setup Cloudflare
1. Sign up at https://cloudflare.com/
2. Add your domain
3. Update nameservers

#### Step 6.2: Configure Caching Rules
1. Go to Rules → Page Rules
2. Create rule: `yourapp.com/api/*`
   - Cache Level: Bypass
3. Create rule: `yourapp.com/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

#### Step 6.3: Setup Image Optimization
1. Go to Speed → Optimization
2. Enable "Auto Minify" for CSS, JS, HTML
3. Enable "Mirage" for images
4. Enable "Polish" for lossless image compression

### Option C: AWS CloudFront (Free tier: 1TB/month)

#### Step 6.1: Create S3 Bucket for Assets
```bash
aws s3 mb s3://starito-assets
aws s3 website s3://starito-assets --index-document index.html
```

#### Step 6.2: Create CloudFront Distribution
1. Go to AWS CloudFront Console
2. Create distribution
3. Origin: Your S3 bucket
4. Viewer Protocol Policy: Redirect HTTP to HTTPS

#### Step 6.3: Update Next.js Config
```typescript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://your-cloudfront-domain.cloudfront.net' 
    : undefined,
  images: {
    domains: ['your-cloudfront-domain.cloudfront.net'],
  },
}
```

---

## 7. 💾 Backup Strategy

### Step 7.1: Airtable Backup Script
Create `scripts/backup-airtable.js`:
```javascript
const fetch = require('node-fetch')
const fs = require('fs')

async function backupAirtable() {
  const tables = ['Users', 'Chores', 'DailyTasks', 'Achievements', 'UserStreaks']
  const backup = { timestamp: new Date().toISOString(), data: {} }
  
  for (const tableName of tables) {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${tableName}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
          }
        }
      )
      
      backup.data[tableName] = await response.json()
      console.log(`✅ Backed up ${tableName}`)
    } catch (error) {
      console.error(`❌ Failed to backup ${tableName}:`, error)
    }
  }
  
  const filename = `backup-${Date.now()}.json`
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2))
  console.log(`💾 Backup saved to ${filename}`)
}

backupAirtable()
```

### Step 7.2: Automated Backups with GitHub Actions
Create `.github/workflows/backup.yml`:
```yaml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install node-fetch
        
      - name: Run backup
        run: node scripts/backup-airtable.js
        env:
          AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: airtable-backup-${{ github.run_number }}
          path: backup-*.json
          retention-days: 30
```

### Step 7.3: Alternative: External Backup Service

#### Option A: Backupify (Paid)
1. Sign up at https://backupify.com/
2. Connect Airtable account
3. Configure daily backups

#### Option B: Manual S3 Backups
Create `scripts/backup-to-s3.js`:
```javascript
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

async function uploadToS3(filename) {
  const fileContent = fs.readFileSync(filename)
  
  const params = {
    Bucket: 'starito-backups',
    Key: `backups/${filename}`,
    Body: fileContent
  }
  
  await s3.upload(params).promise()
  console.log(`Uploaded ${filename} to S3`)
}
```

---

## 8. 🔐 Environment Variables

### Step 8.1: Production Environment Variables
Create these in your Vercel dashboard or hosting provider:

#### Core App Variables
```bash
# Airtable
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_API_KEY=your_api_key

# Next.js
NEXTAUTH_URL=https://yourapp.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret

# Firebase (if using)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# OneSignal (if using)
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key

# Sentry (if using)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Analytics (if using GA4)
NEXT_PUBLIC_GA_ID=your_ga_measurement_id

# LogRocket (if using)
NEXT_PUBLIC_LOGROCKET_APP_ID=your_app_id

# AWS (if using CloudFront)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 8.2: Local Development Variables
Create `.env.local`:
```bash
# Copy all production variables for local development
# Use test/development versions where applicable
```

### Step 8.3: Secure Environment Variable Management
1. Use Vercel's built-in environment variable encryption
2. Never commit `.env` files to git
3. Rotate keys regularly (quarterly)
4. Use least-privilege access for API keys

---

## 9. ✅ Testing Checklist

### Step 9.1: Core Functionality Tests
- [ ] User registration and login (both child and parent)
- [ ] Task assignment and completion
- [ ] Photo upload for tasks
- [ ] Task approval and star awards
- [ ] Streak tracking updates
- [ ] Achievement badge awards
- [ ] Reward redemption
- [ ] Daily task cleanup
- [ ] Weekly task creation

### Step 9.2: API Endpoint Tests
Run these curl commands to test each endpoint:

```bash
# Test daily maintenance
curl -X POST https://yourapp.vercel.app/api/cron/daily-maintenance

# Test user stats
curl "https://yourapp.vercel.app/api/analytics/user-stats?userId=USER_ID&days=7"

# Test streak tracking
curl -X GET "https://yourapp.vercel.app/api/user-streak?userId=USER_ID"

# Test achievements
curl -X GET "https://yourapp.vercel.app/api/user-achievements?userId=USER_ID"
```

### Step 9.3: Accessibility Tests
- [ ] Test with screen reader (NVDA, VoiceOver)
- [ ] Test keyboard navigation (Tab, Enter, Space)
- [ ] Test color contrast with tools like WebAIM
- [ ] Test with zoom levels up to 200%
- [ ] Test with reduced motion enabled

### Step 9.4: Mobile/PWA Tests
- [ ] Test on iOS Safari and Android Chrome
- [ ] Test PWA installation
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Test photo capture from mobile camera
- [ ] Test voice recording

### Step 9.5: Performance Tests
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Test with slow 3G connection
- [ ] Test with large amounts of data
- [ ] Monitor memory usage during long sessions

### Step 9.6: Error Handling Tests
- [ ] Test with Airtable API down
- [ ] Test with no internet connection
- [ ] Test with invalid data inputs
- [ ] Test with expired authentication
- [ ] Verify error monitoring captures issues

---

## 10. 🚀 Go-Live Steps

### Step 10.1: Pre-Launch (1 week before)
1. **Final Testing**
   - [ ] Complete all testing checklist items
   - [ ] Test with real family data
   - [ ] Performance test under load

2. **Setup Monitoring**
   - [ ] Configure Sentry error monitoring
   - [ ] Setup analytics tracking
   - [ ] Setup uptime monitoring (UptimeRobot free)

3. **Prepare Support**
   - [ ] Create user documentation
   - [ ] Setup support email
   - [ ] Prepare FAQ document

### Step 10.2: Launch Day
1. **Deploy to Production**
   ```bash
   vercel --prod
   ```

2. **Verify All Systems**
   - [ ] Cron jobs are running
   - [ ] Push notifications working
   - [ ] Analytics tracking
   - [ ] Error monitoring active
   - [ ] Backup systems operational

3. **Initial Data Setup**
   - [ ] Create initial family accounts
   - [ ] Setup initial chores and rewards
   - [ ] Test complete user flow

### Step 10.3: Post-Launch (First 48 hours)
1. **Monitor Closely**
   - [ ] Check error logs every 2 hours
   - [ ] Monitor system performance
   - [ ] Verify cron jobs execute properly
   - [ ] Check analytics data flowing

2. **User Support**
   - [ ] Be available for immediate user support
   - [ ] Monitor user feedback channels
   - [ ] Document any issues encountered

### Step 10.4: First Week Optimizations
1. **Performance Tuning**
   - [ ] Optimize slow API endpoints
   - [ ] Adjust cache settings if needed
   - [ ] Optimize image sizes and loading

2. **User Feedback Integration**
   - [ ] Collect and analyze user feedback
   - [ ] Prioritize quick wins for user experience
   - [ ] Plan feature improvements

---

## 📞 Support Resources

### Free Tools & Services Summary
- **Hosting**: Vercel (Free tier: Good for MVP)
- **Cron Jobs**: GitHub Actions (Free) or Vercel Cron (Paid)
- **Push Notifications**: Firebase FCM (Free) or OneSignal (10k/month free)
- **Error Monitoring**: Sentry (5k errors/month free)
- **Analytics**: Native (custom) or GA4 (free)
- **CDN**: Vercel Edge Network (included)
- **Backups**: GitHub Actions + Artifacts (free)

### Paid Upgrades (When You Scale)
- **Vercel Pro**: $20/month (includes cron jobs)
- **Fathom Analytics**: $14/month (privacy-focused)
- **Cloudflare Pro**: $20/month (advanced CDN)
- **Advanced error monitoring**: LogRocket, etc.

### Community Resources
- **Vercel Discord**: https://discord.gg/vercel
- **Next.js GitHub**: https://github.com/vercel/next.js
- **Airtable Community**: https://community.airtable.com/

This guide provides everything you need to deploy Starito as a production-ready, professional-grade family app! 🎉