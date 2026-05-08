// server.js - Express + Socket.io server entry point
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const expertRoutes = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { setIO } = require('./controllers/bookingController');

const app = express();
const server = http.createServer(app); // Wrap Express in HTTP server for Socket.io

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Inject io into booking controller so it can emit events
setIO(io);

/**
 * Socket.io Room Strategy (Uber-style targeted delivery):
 * - expertId rooms: Users viewing an expert's detail page join this room.
 *   Only they receive 'slot-booked' events for that expert.
 * - user:email rooms: Users join their email room to receive personal status updates.
 *   Only they receive 'booking-status-updated' events.
 *
 * This prevents broadcasting to everyone - scales to millions of users.
 */
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join expert room for slot updates
  socket.on('join-expert-room', (expertId) => {
    socket.join(expertId);
    console.log(`📍 Socket ${socket.id} joined expert room: ${expertId}`);
  });

  // Leave expert room (when navigating away from detail page)
  socket.on('leave-expert-room', (expertId) => {
    socket.leave(expertId);
  });

  // Join personal email room for booking status updates
  socket.on('join-user-room', (email) => {
    socket.join(`user:${email}`);
    console.log(`👤 Socket ${socket.id} joined user room: user:${email}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (used by Railway/Render for uptime monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 handler for unrecognized routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Socket.io ready for real-time connections`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
  });
};

startServer();
