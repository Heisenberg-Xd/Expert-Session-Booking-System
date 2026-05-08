// prisma/seed.js — Realistic seed: 10 experts + availability slots + 5 bookings
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Expert definitions ───────────────────────────────────────────────────────
const EXPERTS = [
  {
    name: 'Arjun Sharma', category: 'Technology', experience: 12, rating: 4.9, hourlyRate: 250,
    bio: 'Senior Staff Engineer at Google. Expert in distributed systems, Kubernetes, and Go. Former tech lead at Flipkart.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Arjun',
  },
  {
    name: 'Priya Mehta', category: 'Business', experience: 8, rating: 4.8, hourlyRate: 300,
    bio: 'Ex-McKinsey consultant and startup founder. Helped 30+ startups raise Series A funding.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Priya',
  },
  {
    name: 'Rahul Gupta', category: 'Technology', experience: 10, rating: 4.7, hourlyRate: 220,
    bio: 'ML Engineer at Meta. Expert in LLMs, PyTorch, and production AI systems. PhD from IIT Delhi.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Rahul',
  },
  {
    name: 'Dr. Anjali Singh', category: 'Health', experience: 15, rating: 4.9, hourlyRate: 180,
    bio: 'Integrative medicine physician and certified life coach. Specialises in stress management and holistic wellness.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Anjali',
  },
  {
    name: 'Vikram Nair', category: 'Design', experience: 9, rating: 4.6, hourlyRate: 200,
    bio: 'Principal UX Designer at Adobe. Previously at Apple. Expert in design systems and accessibility.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Vikram',
  },
  {
    name: 'Sneha Patel', category: 'Education', experience: 7, rating: 4.8, hourlyRate: 150,
    bio: 'EdTech founder and curriculum designer. Has trained 10,000+ students in data science.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Sneha',
  },
  {
    name: 'Karthik Iyer', category: 'Technology', experience: 6, rating: 4.5, hourlyRate: 175,
    bio: 'Full-stack engineer specialising in React, Node.js, and AWS. Open source contributor with 5k GitHub stars.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Karthik',
  },
  {
    name: 'Neha Verma', category: 'Business', experience: 11, rating: 4.7, hourlyRate: 280,
    bio: 'Product leader and former VP at Razorpay. Expert in fintech and go-to-market strategy.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Neha',
  },
  {
    name: 'Aditya Kumar', category: 'Design', experience: 5, rating: 4.4, hourlyRate: 160,
    bio: 'Brand identity designer and creative director. Works with Fortune 500 companies on visual identity systems.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Aditya',
  },
  {
    name: 'Dr. Meera Krishnan', category: 'Education', experience: 13, rating: 4.9, hourlyRate: 200,
    bio: 'Professor of CS and AI researcher. Author of 3 textbooks on algorithms and machine learning.',
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Meera',
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
 */
function buildSlots(expertId) {
  const slots = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

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
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const day2     = new Date(today); day2.setDate(today.getDate() + 2);

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
