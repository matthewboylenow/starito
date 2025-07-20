# 🌟 Starito – Project Summary & Build Plan

**Starito** is a gamified reward system for kids, designed to encourage positive behaviors using a point system, star-themed visuals, and dynamic daily challenges. Built for use in a family setting—with potential to scale as a public-facing app—Starito balances **fun for kids** with **professional UX polish** and a **flexible admin backend**.

---

## ✅ Project Intent & Stack

This document is meant to provide Anthropic’s Claude with full project context. Claude, please use this file to guide all future coding sessions. Refer back to it for design, functionality, authentication, and stack specifications.

---

### ⚙️ Stack Summary

- **IDE**: GitHub Codespaces
- **Framework**: Next.js 15 (App Router)
- **File Structure**: No `src` directory
- **Bundler**: Not using Turbopack
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with full custom config (no default classes)
- **State/Animation**: Zustand or context + Framer Motion
- **Backend**: Airtable (REST API via fetch)
- **Authentication**:
  - **Child**: Tap-to-login + PIN
  - **Parent**: Basic auth (username + password) stored in separate Airtable table
- **App Type**: PWA (installable on iPad)

---

## 🎨 Branding & Design System

### App Name: **Starito**

A fun, family-rooted name derived from the nickname “Burrito” (used for the user's older son). Future-scale friendly.

---

### Color Palette

| Purpose     | Hex        | Notes |
|-------------|------------|-------|
| Primary     | `#4A90E2`  | Bright blue |
| Accent 1    | `#FFD166`  | Yellow/gold for star cues |
| Accent 2    | `#EF476F`  | Red-pink highlight |
| Success     | `#06D6A0`  | Light green for completed tasks |
| Background  | `#F9FAFB`  | Clean gray-white |
| Text        | `#1E1E1E`  | Slate black |

---

### Font Pairing

| Role         | Font               | Source        |
|--------------|--------------------|---------------|
| Headings     | Bricolage Grotesque| Google Fonts  |
| Body         | Nunito Sans        | Google Fonts  |

Tailwind config should load and register these fonts in `fontFamily`.

---

### UI Principles

- No generic Tailwind components
- All colors mapped to a custom theme
- Rounded cards, motion-based feedback, delightful spacing
- **PWA-optimized** UI for touch-first devices like iPad
- Light animation polish using `framer-motion` or Tailwind Animate

---

## 🔐 Authentication

### 👦 Child Login

- Splash screen with user avatar/name
- Tapping user prompts for 4-digit PIN
- PINs stored in Airtable’s `Users` table
- No email login required

### 👨 Parent Login

- Login form with `username` + `password`
- Credentials stored in Airtable `Parents` table
- On success, shows admin dashboard `/parent`

---

## 📋 Airtable Tables

### `Users`, `Chores`, `DailyTasks`, `Challenges`, `Rewards`, `Transactions`
(see detailed schema in original summary)

---

## 🧠 App Routes & Layout

```
/app
  /login
  /kid
  /parent
  /parent/rewards
  /parent/challenges
  /parent/transactions
  /api/
/public/icons
/components
/lib
/styles
```

---

## 🔌 API Endpoints

(see detailed list in original summary)

---

## ✍️ Claude To-Do Tracker

Claude, create a `TASKS_STARITO.md` file that includes:
- API route checklist
- UI component checklist
- Tailwind setup checklist
- Airtable integration steps
- Authentication flow checklist
- PWA registration checklist
- Testing checklist

---

## 🚀 Claude Instructions

Claude, please:
- Use the details above in all code logic and layout
- Prioritize clean, purposeful design
- Do not use default Tailwind spacing, colors, or layouts
- Implement animations using `framer-motion`
- Provide full component code, not partial snippets

---

## 🧩 Final Notes

This app is being built for real family use but may be expanded into a public product. Treat all flows and visual design like a real, funded startup product.