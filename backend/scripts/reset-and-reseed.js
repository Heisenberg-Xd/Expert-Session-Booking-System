#!/usr/bin/env node
// scripts/reset-and-reseed.js
// Run this ONCE on the production server to:
// 1. Wipe all corrupted slots/bookings with wrong timezone dates
// 2. Re-seed with correct UTC midnight dates
//
// Usage: node scripts/reset-and-reseed.js
// OR via npm:  npm run db:seed (which runs prisma/seed.js that already does this)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log('\n🔴 PRODUCTION RESET & RESEED\n');
  console.log('⚠️  This will DELETE all existing bookings and availability slots.\n');

  try {
    // Show current state before deleting
    const slotCount    = await prisma.availabilitySlot.count();
    const bookingCount = await prisma.booking.count();
    const expertCount  = await prisma.expert.count();

    console.log(`📊 Current DB state:`);
    console.log(`   Experts:  ${expertCount}`);
    console.log(`   Slots:    ${slotCount}`);
    console.log(`   Bookings: ${bookingCount}\n`);

    // Show a sample of stored dates to diagnose timezone corruption
    const sample = await prisma.availabilitySlot.findMany({ take: 3, select: { date: true, timeSlot: true } });
    console.log('🔍 Sample stored dates (should be T00:00:00.000Z for correct UTC midnight):');
    sample.forEach(s => console.log(`   ${s.date.toISOString()}  —  ${s.timeSlot}`));

    const isCorrupted = sample.some(s => !s.date.toISOString().endsWith('T00:00:00.000Z'));
    if (isCorrupted) {
      console.log('\n❌ DETECTED: Slot dates are NOT UTC midnight. Timezone corruption confirmed.\n');
    } else {
      console.log('\n✅ Slot dates appear to be correct UTC midnight.\n');
    }

    // Wipe and re-seed via seed.js
    console.log('🗑️  Wiping corrupt data...');
    await prisma.booking.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    console.log('   ✅ All bookings deleted');
    console.log('   ✅ All slots deleted');

    console.log('\n🌱 Re-running seed with UTC midnight dates...\n');

    // Hand off to the main seed script
    await prisma.$disconnect();
    require('./prisma/seed');

  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

reset();
