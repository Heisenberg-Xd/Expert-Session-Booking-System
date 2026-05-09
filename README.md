
# 📅 Expert Session Booking System

## Overview

This project is a production-grade, real-time Expert Session Booking System. It features a robust backend built with Node.js, Express, and PostgreSQL (via Prisma ORM) and also ensuring high concurrency support and race-condition safety. The frontend is a modern React application utilizing Vite for performance and Socket.io for real-time availability updates.

## Features

* Real-time Slot Updates
* Race Condition Prevention
* Paginated Expert Listings
* Category & Search Filters
* Atomic Booking Transactions
* Email-based Booking Tracking
* Dynamic Availability Grid
* Aesthetic Dark Mode UI

## Key Features

| Feature | Description |
|--------|-------------|
| Race-Safe Booking | Uses Prisma `$transaction` and PostgreSQL row-level locks to prevent double-bookings |
| Real-time Sync | Socket.io room-based updates for instant slot availability across all clients |
| Scalable Schema | Normalized PostgreSQL structure with optimized indexes for fast expert lookups |
| Advanced Filtering | Debounced search and category-based filtering for a smooth user experience |
| Error Handling | Structured API responses with specific 409 Conflict handling for race conditions |
| Modern Frontend | React + Vite with a custom CSS design system and fluid micro-animations |

## Project Structure

```text
expert-booking-system/
  backend/
    prisma/
      schema.prisma      # PostgreSQL Relational Schema
      seed.js            # Database Seeder (10 Experts, 630 Slots)
    src/
      controllers/       # Business Logic (Prisma Queries)
      lib/               # Prisma Client Singleton
      middleware/        # Error Handling & Validation
      routes/            # API Endpoints
      server.js          # Express + Socket.io Entry Point
  frontend/
    src/
      components/        # UI Components (ExpertList, Detail, Form)
      hooks/             # Custom React Hooks (Real-time Socket)
      services/          # API & Socket.io Clients
      App.jsx            # Routing & Layout
      index.css          # Design System & Styling
    package.json
  README.md
```

## Setup Instructions

```bash
# 1. Clone repository
git clone <repository-url>
cd expert-booking-system

# 2. Backend Setup
cd backend
npm install

# 3. Database Configuration
# Update DATABASE_URL in backend/.env with your PostgreSQL URI
npx prisma db push       # Sync schema to DB
npm run db:seed          # Seed initial expert data

# 4. Frontend Setup
cd ../frontend
npm install

# 5. Environment Variables
# Check frontend/.env for VITE_API_URL=http://localhost:5001
```

## Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
*Runs on http://localhost:5001*

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
```
*Runs on http://localhost:5173*

## API Endpoints

### Experts
```bash
# Get paginated experts
GET /api/experts?page=1&limit=6&search=arjun&category=Technology

# Get expert details with availability
GET /api/experts/:id

# Get all categories
GET /api/experts/categories
```

### Bookings
```bash
# Create a new booking (Transactional)
POST /api/bookings

# Fetch bookings by email
GET /api/bookings?email=user@example.com
```

## Real-time Communication

The system uses **Socket.io Rooms** for efficient event delivery:
* **Expert Rooms (`expertId`)**: Clients join a room specific to an expert to receive live `slot-booked` updates.
* **User Rooms (`user:email`)**: Clients receive personal notifications when booking statuses change (e.g., PENDING → CONFIRMED).

## Why This Implementation

| Aspect | This Project | Basic Implementation |
|-------|-------------|----------------------|
| Database | PostgreSQL (Prisma) | MongoDB (Mongoose) |
| Concurrency | Transactional Locks | Simple Save (Race-prone) |
| Updates | Real-time Sockets | Manual Refresh / Polling |
| Codebase | Modular Controller/Service | Single File / Spaghetti |
| Styling | Custom Design System | Standard Component Lib |
| UI/UX | Optimized Skeletons | Loading Spinners |

---
Built with ❤️ for High Performance Scaling
