// prisma/seed.js — Realistic seed: 10 experts + availability slots + 5 bookings
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Expert definitions ───────────────────────────────────────────────────────
const EXPERTS = [
  {
    name: 'Arjun Sharma', category: 'Technology', experience: 12, rating: 4.9, hourlyRate: 250,
    bio: 'Senior Staff Engineer at Google. Expert in distributed systems, Kubernetes, and Go. Former tech lead at Flipkart.',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 142, responseTime: 'Replies within 2 hours', repeatClientPct: 85, company: 'Google', role: 'Senior Staff Engineer'
  },
  {
    name: 'Priya Mehta', category: 'Business', experience: 8, rating: 4.8, hourlyRate: 300,
    bio: 'Ex-McKinsey consultant and startup founder. Helped 30+ startups raise Series A funding.',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 89, responseTime: 'Replies within 1 hour', repeatClientPct: 92, company: 'McKinsey (Former)', role: 'Startup Advisor'
  },
  {
    name: 'Rahul Gupta', category: 'Technology', experience: 10, rating: 4.7, hourlyRate: 220,
    bio: 'ML Engineer at Meta. Expert in LLMs, PyTorch, and production AI systems. PhD from IIT Delhi.',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 215, responseTime: 'Replies within 4 hours', repeatClientPct: 78, company: 'Meta', role: 'Senior ML Engineer'
  },
  {
    name: 'Dr. Anjali Singh', category: 'Health', experience: 15, rating: 4.9, hourlyRate: 180,
    bio: 'Integrative medicine physician and certified life coach. Specialises in stress management and holistic wellness.',
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 340, responseTime: 'Replies within 1 day', repeatClientPct: 95, company: 'Holistic Health', role: 'Integrative Physician'
  },
  {
    name: 'Vikram Nair', category: 'Design', experience: 9, rating: 4.6, hourlyRate: 200,
    bio: 'Principal UX Designer at Adobe. Previously at Apple. Expert in design systems and accessibility.',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 67, responseTime: 'Replies within 1 hour', repeatClientPct: 80, company: 'Adobe', role: 'Principal UX Designer'
  },
  {
    name: 'Sneha Patel', category: 'Education', experience: 7, rating: 4.8, hourlyRate: 150,
    bio: 'EdTech founder and curriculum designer. Has trained 10,000+ students in data science.',
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 112, responseTime: 'Replies within 2 hours', repeatClientPct: 88, company: 'DataCamp', role: 'Curriculum Director'
  },
  {
    name: 'Karthik Iyer', category: 'Technology', experience: 6, rating: 4.5, hourlyRate: 175,
    bio: 'Full-stack engineer specialising in React, Node.js, and AWS. Open source contributor with 5k GitHub stars.',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 45, responseTime: 'Replies within 3 hours', repeatClientPct: 75, company: 'Stripe', role: 'Software Engineer'
  },
  {
    name: 'Neha Verma', category: 'Business', experience: 11, rating: 4.7, hourlyRate: 280,
    bio: 'Product leader and former VP at Razorpay. Expert in fintech and go-to-market strategy.',
    profileImage: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 198, responseTime: 'Replies within 1 hour', repeatClientPct: 91, company: 'Razorpay', role: 'VP of Product (Former)'
  },
  {
    name: 'Aditya Kumar', category: 'Design', experience: 5, rating: 4.4, hourlyRate: 160,
    bio: 'Brand identity designer and creative director. Works with Fortune 500 companies on visual identity systems.',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 34, responseTime: 'Replies within 4 hours', repeatClientPct: 70, company: 'Pentagram', role: 'Creative Director'
  },
  {
    name: 'Dr. Meera Krishnan', category: 'Education', experience: 13, rating: 4.9, hourlyRate: 200,
    bio: 'Professor of CS and AI researcher. Author of 3 textbooks on algorithms and machine learning.',
    profileImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=256&h=256&auto=format&fit=crop',
    verified: true, sessionsCompleted: 280, responseTime: 'Replies within 2 days', repeatClientPct: 96, company: 'Stanford Univ.', role: 'CS Professor'
  },
];

// Time slots: 9 AM – 5 PM hourly
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

/**
 * Build AvailabilitySlot rows for a given expertId.
 * Generates 7 days × 9 slots = 63 rows per expert.
 * CRITICAL: Always uses Date.UTC to produce midnight UTC timestamps.
 * Using setHours(0,0,0,0) stores LOCAL midnight — which is wrong on non-UTC servers.
 */
function buildSlots(expertId) {
  const slots = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    // Explicitly construct UTC midnight — timezone-proof
    const date = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      0, 0, 0, 0
    ));

    for (const timeSlot of TIME_SLOTS) {
      slots.push({ expertId, date, timeSlot, isBooked: false });
    }
  }
  return slots;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ── Clear existing data (order matters due to FK constraints)
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.expert.deleteMany();
  console.log('🗑️  Cleared existing data');

  // ── Create experts + their slots using createMany for performance
  const createdExperts = [];

  for (const expertData of EXPERTS) {
    const expert = await prisma.expert.create({ data: expertData });
    createdExperts.push(expert);

    await prisma.availabilitySlot.createMany({
      data: buildSlots(expert.id),
    });

    console.log(`  ✅ Created expert: ${expert.name} (${expert.category})`);
  }

  console.log(`\n✅ ${createdExperts.length} experts with ${createdExperts.length * 63} slots created`);

  // ── Create 5 sample bookings with varied statuses
  // CRITICAL: All sample booking dates must also be UTC midnight to match slots.
  const now2 = new Date();
  const today    = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate(), 0, 0, 0, 0));
  const tomorrow = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() + 1, 0, 0, 0, 0));
  const day2     = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() + 2, 0, 0, 0, 0));

  // Helper: find a specific slot and mark it booked
  const bookSlot = async (expertIdx, date, timeSlot, bookingData) => {
    const expert = createdExperts[expertIdx];

    const slot = await prisma.availabilitySlot.findFirst({
      where: { expertId: expert.id, date, timeSlot, isBooked: false },
    });

    if (!slot) {
      console.warn(`  ⚠️  Slot not found: ${expert.name} ${timeSlot}`);
      return;
    }

    // Use a transaction to atomically mark + create (same as production path)
    await prisma.$transaction([
      prisma.availabilitySlot.update({
        where: { id: slot.id },
        data:  { isBooked: true },
      }),
      prisma.booking.create({
        data: {
          expertId:   expert.id,
          expertName: expert.name,
          slotId:     slot.id,
          bookingDate: date,
          timeSlot,
          ...bookingData,
        },
      }),
    ]);

    console.log(`  📅 Booked: ${expert.name} @ ${timeSlot} — ${bookingData.status}`);
  };

  await bookSlot(0, today, '10:00 AM', {
    userName: 'Rohit Kumar', userEmail: 'rohit@example.com',
    userPhone: '9876543210', status: 'CONFIRMED',
    notes: 'Career transition to ML',
  });

  await bookSlot(1, today, '2:00 PM', {
    userName: 'Divya Sharma', userEmail: 'divya@example.com',
    userPhone: '9123456789', status: 'PENDING',
    notes: 'Fundraising advice for Series A',
  });

  await bookSlot(2, tomorrow, '11:00 AM', {
    userName: 'Amit Patel', userEmail: 'amit@example.com',
    userPhone: '8765432109', status: 'PENDING',
    notes: 'Help with model deployment pipeline',
  });

  await bookSlot(3, today, '9:00 AM', {
    userName: 'Kavya Reddy', userEmail: 'kavya@example.com',
    userPhone: '7654321098', status: 'COMPLETED',
    notes: 'Wellness consultation — burnout recovery',
  });

  await bookSlot(4, day2, '3:00 PM', {
    userName: 'Suresh Babu', userEmail: 'suresh@example.com',
    userPhone: '6543210987', status: 'CONFIRMED',
    notes: 'Design audit for mobile app',
  });

  console.log('\n🚀 Seed complete!');
  console.log('📧 Test emails: rohit@example.com · divya@example.com · amit@example.com · kavya@example.com · suresh@example.com');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
