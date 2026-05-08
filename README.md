# ExpertConnect – Real-Time Expert Session Booking System

> Production-grade booking platform built like you're launching to 1 million users.  
> **Race-condition safe** · **Real-time** · **Paginated** · **Socket.io powered**

---

## 🏗 Architecture

```
booking-system/
├── backend/                    # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection
│   │   ├── models/             # Expert + Booking schemas (compound indexes)
│   │   ├── controllers/        # Business logic (transactions, socket events)
│   │   ├── routes/             # REST API routes
│   │   ├── middleware/         # Error classes + validation
│   │   └── utils/seedData.js   # 10 experts + 5 bookings
│   └── package.json
└── frontend/                   # React + Vite
    ├── src/
    │   ├── components/         # ExpertList, ExpertDetail, BookingForm, MyBookings
    │   ├── services/           # Axios API + Socket.io singleton
    │   ├── hooks/              # useRealTimeSlots
    │   └── App.jsx
    └── package.json
```

## 🚀 Local Setup

### 1. MongoDB Atlas
Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and get your connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env → paste your MONGODB_URI
npm run dev        # starts on :5000
npm run seed       # seeds 10 experts + 5 bookings
```

### 3. Frontend
```bash
cd frontend
# .env is already set to http://localhost:5000
npm run dev        # starts on :5173
```

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/experts` | List experts (search, filter, paginate) |
| `GET`  | `/api/experts/:id` | Expert detail + availability |
| `POST` | `/api/bookings` | Create booking **(transaction-safe)** |
| `GET`  | `/api/bookings?email=` | My bookings by email |
| `PATCH`| `/api/bookings/:id/status` | Update status (state machine) |

### Query params for `GET /experts`
```
?page=1&limit=6&search=arjun&category=Technology&sortBy=rating&order=desc
```

## ⚡ Race Condition Handling

```javascript
// POST /bookings — atomic read-then-write within a MongoDB transaction
const session = await mongoose.startSession();
session.startTransaction();
// 1. Check slot availability (within lock)
// 2. Create booking (within lock)  
// 3. Mark slot as booked (within lock)
await session.commitTransaction();
// 4. Emit socket event ONLY after commit
io.to(expertId).emit('slot-booked', { expertId, bookingDate, timeSlot });
```

Two users clicking "Book" simultaneously → only ONE wins → other gets **409 Conflict**.

## 🔴 Real-Time Architecture

- **Socket.io Rooms** (not broadcast-all): each expert has a room, users have email rooms
- Client joins `expertId` room on detail page → receives `slot-booked` events
- Client joins `user:email` room on MyBookings → receives `booking-status-updated`
- Slots patch local React state instantly without re-fetching

## 🌐 Deployment

### Backend → Railway / Render
```
MONGODB_URI=<Atlas URI>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend → Vercel
```
VITE_API_URL=https://your-backend.railway.app
```

## 🧪 Race Condition Test

1. Open two browser windows side-by-side
2. Both navigate to the same expert detail page
3. Both select the **same slot**
4. Click **Book Now** simultaneously in both windows
5. ✅ Only ONE booking succeeds
6. ❌ Other window gets: "Slot just got booked!"
7. 🔴 Slot turns gray (real-time) in both windows

## 📧 Test Accounts (after seeding)

| Email | Bookings |
|-------|----------|
| `rohit@example.com` | 1 confirmed |
| `divya@example.com` | 1 pending |
| `amit@example.com` | 1 pending |
| `kavya@example.com` | 1 completed |
| `suresh@example.com`| 1 confirmed |
