// src/lib/prisma.js — Singleton Prisma client
//
// Why singleton? PrismaClient opens a connection pool. In development, Next.js / Nodemon
// hot-reloads create new module instances each time, exhausting connections fast.
// The global singleton pattern avoids that in dev while staying clean in production.

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: 'colorless',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
