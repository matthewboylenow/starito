# ✅ Starito – Development Task Checklist

This checklist is designed for Claude to track and manage development progress.

---

## 📁 API Routes

- [ ] `/api/login-child` (POST)
- [ ] `/api/login-parent` (POST)
- [ ] `/api/get-daily-tasks` (GET)
- [ ] `/api/submit-task` (POST)
- [ ] `/api/approve-task` (POST)
- [ ] `/api/get-stars` (GET)
- [ ] `/api/redeem-reward` (POST)
- [ ] `/api/set-challenge` (POST)
- [ ] `/api/adjust-stars` (POST)

---

## 🧱 UI Components

### Kid View
- [ ] Splash login with PIN
- [ ] Dashboard: task list, point balance, active challenge
- [ ] Redeem reward screen
- [ ] Feedback toast (+5 points, etc.)

### Parent View
- [ ] Basic auth login
- [ ] Dashboard with child task approval
- [ ] Reward manager
- [ ] Challenge manager
- [ ] Manual point editor
- [ ] Transaction history

---

## 🎨 Tailwind & Theming

- [ ] Add Bricolage Grotesque + Nunito Sans
- [ ] Configure `tailwind.config.js` with brand colors
- [ ] Build spacing, padding, and radius tokens
- [ ] Create reusable component classes

---

## 🔐 Authentication

- [ ] Validate PIN for child from Airtable
- [ ] Basic auth login for parent (Airtable credentials)
- [ ] Store session locally for reuse

---

## 🔗 Airtable Integration

- [ ] Set up base with all tables
- [ ] Create reusable fetch utility
- [ ] Abstract all CRUD logic into `/lib/airtable.ts`

---

## 📱 PWA Support

- [ ] Add PWA manifest and icons
- [ ] Configure `next-pwa`
- [ ] Enable offline caching and installability
- [ ] Confirm iPad fullscreen behavior

---

## ✅ Testing & Deployment

- [ ] Test flows on desktop + iPad
- [ ] Test offline usage (PWA)
- [ ] Deploy to Vercel
- [ ] Add environment variable templates