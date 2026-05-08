
  _____                       _   _____                            _   
 | ____|_  ___ __   ___ _ __ | |_|  ___|__  _ __ _ __ ___   ___  ___| |_ 
 |  _| \ \/ / '_ \ / _ \ '__|| __| |_ / _ \| '__| '_ ` _ \ / _ \/ __| __|
 | |___ >  <| |_) |  __/ |   | |_|  _| (_) | |  | | | | | |  __/ (__| |_ 
 |_____/_/\_\ .__/ \___|_|    \__|_|  \___/|_|  |_| |_| |_|\___|\___|\__|
            |_|                                                          

# 🚀 Expert Session Booking System

A production-grade, real-time platform for booking expert sessions, built with high performance and scalability in mind.

## 🏗 Architecture
- **Frontend**: React + Vite (Aesthetic Dark Mode)
- **Backend**: Node.js + Express
- **ORM**: Prisma (PostgreSQL)
- **Real-time**: Socket.io (Room-based updates)
- **Database**: Neon PostgreSQL

## 🌟 Key Features
- **Race Condition Safety**: Uses Prisma transactions to prevent double-bookings.
- **Real-time Updates**: Live slot availability updates via Socket.io.
- **Advanced Filtering**: Debounced search and category filtering.
- **Clean UI**: Premium dark mode experience with fluid animations.
- **Scalable Design**: Relational schema with optimized indexes.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Configure DATABASE_URL in .env
npx prisma db push
npm run db:seed
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🛠 Tech Stack
- **Database**: PostgreSQL (Neon)
- **Server**: Node.js, Express, Socket.io
- **Client**: React, Vite, Axios, Socket.io-client
- **Styling**: Vanilla CSS (Premium Tokens)

---
Built with ❤️ by Heisenberg-Xd
