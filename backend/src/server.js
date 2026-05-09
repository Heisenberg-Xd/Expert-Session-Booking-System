// server.js — Express + Socket.io entry point (Mongoose fully removed)
// 🚀 Main entry point for the ExpertConnect backend server.
// Configures Express middleware, Socket.io real-time communication, and Prisma connection.
require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');

const prisma        = require('./lib/prisma');
const expertRoutes  = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const debugRoutes   = require('./routes/debugRoutes');   // TEMP: remove after diagnostics
const { globalErrorHandler } = require('./middleware/errorHandler');
const { setIO } = require('./controllers/bookingController');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Inject io into the booking controller so it can emit events post-commit
setIO(io);

/**
 * Socket.io Room Strategy (same as before — no change needed in frontend):
 *
 * • expertId rooms  — ExpertDetail page joins when viewing a slot grid.
 *                     Receives 'slot-booked' events for that expert only.
 *
 * • user:email rooms — MyBookings joins to receive personal status updates.
 *                      Receives 'booking-status-updated' events.
 */
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-expert-room',  (expertId) => socket.join(expertId));
  socket.on('leave-expert-room', (expertId) => socket.leave(expertId));
  socket.on('join-user-room',    (email)    => socket.join(`user:${email}`));

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    // Ping the DB — confirms Prisma connection is live
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status:    'ok',
      db:        'postgresql',
      orm:       'prisma',
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV,
    });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'unreachable', error: err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/experts',  expertRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/debug',    debugRoutes);   // TEMP diagnostic route

// 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify DB connection before accepting traffic
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌐 API  : http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown — release DB connection pool on SIGTERM (Railway/Render)
process.on('SIGTERM', async () => {
  console.log('⚡ SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

start();
