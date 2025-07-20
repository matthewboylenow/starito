# 🌟 Starito

A gamified reward system for kids built with Next.js 15, designed to encourage positive behaviors through a point-based star system.

## 🚀 Features

- **Child-friendly interface** with PIN-based login
- **Parent dashboard** for task approval and management
- **Star-based reward system** with redeemable rewards
- **Daily task tracking** with photo submissions
- **PWA support** for iPad installation
- **Real-time updates** with Airtable backend

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Backend**: Airtable REST API
- **Deployment**: Vercel

## 📋 Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure your Airtable base:
   - Create an Airtable base with the required tables
   - Add your `AIRTABLE_BASE_ID` and `AIRTABLE_API_KEY` to `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Airtable Schema

The app requires the following tables in Airtable:

- **Users**: Child profiles with PINs and star totals
- **Parents**: Parent login credentials
- **Chores**: Available tasks with star values
- **DailyTasks**: Assigned tasks for each day
- **Challenges**: Special goals with bonus rewards
- **Rewards**: Items kids can redeem with stars
- **Transactions**: History of all star earning/spending

## 🎨 Design System

- **Primary Color**: #4A90E2 (Blue)
- **Accent Colors**: #FFD166 (Gold), #EF476F (Pink)
- **Success Color**: #06D6A0 (Green)
- **Fonts**: Bricolage Grotesque (headings), Nunito Sans (body)

## 📱 PWA Installation

The app is optimized for iPad use and can be installed as a PWA:

1. Open in Safari on iPad
2. Tap the Share button
3. Select "Add to Home Screen"
4. Enjoy the full-screen experience!

## 🔐 Authentication

- **Kids**: 4-digit PIN entry
- **Parents**: Username/password login
- Session persistence with local storage

## 🧞 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 📄 License

Built with ❤️ for families everywhere.