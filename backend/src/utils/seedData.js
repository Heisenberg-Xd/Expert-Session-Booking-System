// utils/seedData.js - Seed 10 experts + 5 bookings for demo
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Expert = require('../models/Expert');
const Booking = require('../models/Booking');

const CATEGORIES = ['Technology', 'Business', 'Health', 'Education', 'Design'];

const EXPERTS_DATA = [
  {
    name: 'Arjun Sharma',
    category: 'Technology',
    experience: 12,
    rating: 4.9,
    bio: 'Senior Staff Engineer at Google with expertise in distributed systems, Kubernetes, and Go. Former tech lead at Flipkart.',
    hourlyRate: 250,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Arjun',
  },
  {
    name: 'Priya Mehta',
    category: 'Business',
    experience: 8,
    rating: 4.8,
    bio: 'Ex-McKinsey consultant and startup founder. Helped 30+ startups raise Series A funding.',
    hourlyRate: 300,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Priya',
  },
  {
    name: 'Rahul Gupta',
    category: 'Technology',
    experience: 10,
    rating: 4.7,
    bio: 'ML Engineer at Meta. Expert in LLMs, PyTorch, and production AI systems. PhD in Computer Science from IIT Delhi.',
    hourlyRate: 220,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Rahul',
  },
  {
    name: 'Dr. Anjali Singh',
    category: 'Health',
    experience: 15,
    rating: 4.9,
    bio: 'Integrative medicine physician and certified life coach. Specializes in stress management and holistic wellness.',
    hourlyRate: 180,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Anjali',
  },
  {
    name: 'Vikram Nair',
    category: 'Design',
    experience: 9,
    rating: 4.6,
    bio: 'Principal UX Designer at Adobe. Previously at Apple. Expert in design systems, accessibility, and user research.',
    hourlyRate: 200,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Vikram',
  },
  {
    name: 'Sneha Patel',
    category: 'Education',
    experience: 7,
    rating: 4.8,
    bio: 'EdTech founder and curriculum designer. Has trained 10,000+ students in data science and analytics.',
    hourlyRate: 150,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Sneha',
  },
  {
    name: 'Karthik Iyer',
    category: 'Technology',
    experience: 6,
    rating: 4.5,
    bio: 'Full-stack engineer specializing in React, Node.js, and AWS. Open source contributor with 5k GitHub stars.',
    hourlyRate: 175,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Karthik',
  },
  {
    name: 'Neha Verma',
    category: 'Business',
    experience: 11,
    rating: 4.7,
    bio: 'Product leader and former VP at Razorpay. Expert in fintech, product strategy, and go-to-market planning.',
    hourlyRate: 280,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Neha',
  },
  {
    name: 'Aditya Kumar',
    category: 'Design',
    experience: 5,
    rating: 4.4,
    bio: 'Brand identity designer and creative director. Works with Fortune 500 companies on visual identity systems.',
    hourlyRate: 160,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Aditya',
  },
  {
    name: 'Dr. Meera Krishnan',
    category: 'Education',
    experience: 13,
    rating: 4.9,
    bio: 'Professor of Computer Science and AI researcher. Author of 3 textbooks on algorithms and machine learning.',
    hourlyRate: 200,
    profileImage: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Meera',
  },
];

/**
 * Generate hourly time slots from 9 AM to 6 PM.
 * Returns array of { time, isBooked } objects.
 */
const generateSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    slots.push({ time: `${displayHour}:00 ${period}`, isBooked: false });
  }
  return slots;
};

/**
 * Generate availability for the next 7 days.
 */
const generateAvailability = () => {
  const availability = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    availability.push({ date, slots: generateSlots() });
  }
  return availability;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Expert.deleteMany({});
    await Booking.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create experts with availability
    const expertsWithAvailability = EXPERTS_DATA.map(e => ({
      ...e,
      availability: generateAvailability(),
    }));

    const createdExperts = await Expert.insertMany(expertsWithAvailability);
    console.log(`✅ Created ${createdExperts.length} experts`);

    // Create 5 sample bookings with varied statuses
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sampleBookings = [
      {
        expertId: createdExperts[0]._id,
        expertName: createdExperts[0].name,
        userName: 'Rohit Kumar',
        userEmail: 'rohit@example.com',
        userPhone: '9876543210',
        bookingDate: today,
        timeSlot: '10:00 AM',
        status: 'confirmed',
        notes: 'Want to discuss career transition to ML',
      },
      {
        expertId: createdExperts[1]._id,
        expertName: createdExperts[1].name,
        userName: 'Divya Sharma',
        userEmail: 'divya@example.com',
        userPhone: '9123456789',
        bookingDate: today,
        timeSlot: '2:00 PM',
        status: 'pending',
        notes: 'Fundraising advice for Series A',
      },
      {
        expertId: createdExperts[2]._id,
        expertName: createdExperts[2].name,
        userName: 'Amit Patel',
        userEmail: 'amit@example.com',
        userPhone: '8765432109',
        bookingDate: new Date(today.getTime() + 86400000),
        timeSlot: '11:00 AM',
        status: 'pending',
        notes: 'Help with model deployment pipeline',
      },
      {
        expertId: createdExperts[3]._id,
        expertName: createdExperts[3].name,
        userName: 'Kavya Reddy',
        userEmail: 'kavya@example.com',
        userPhone: '7654321098',
        bookingDate: new Date(today.getTime() - 86400000),
        timeSlot: '9:00 AM',
        status: 'completed',
        notes: 'Wellness consultation - burnout recovery',
      },
      {
        expertId: createdExperts[4]._id,
        expertName: createdExperts[4].name,
        userName: 'Suresh Babu',
        userEmail: 'suresh@example.com',
        userPhone: '6543210987',
        bookingDate: new Date(today.getTime() + 2 * 86400000),
        timeSlot: '3:00 PM',
        status: 'confirmed',
        notes: 'Design audit for mobile app',
      },
    ];

    await Booking.insertMany(sampleBookings);
    console.log(`✅ Created ${sampleBookings.length} sample bookings`);

    // Mark the seeded slots as booked in expert availability
    for (const booking of sampleBookings) {
      if (booking.status !== 'cancelled') {
        const bookDate = new Date(booking.bookingDate);
        bookDate.setHours(0, 0, 0, 0);
        await Expert.updateOne(
          { _id: booking.expertId, 'availability.date': bookDate },
          {
            $set: {
              'availability.$[dateElem].slots.$[slotElem].isBooked': true,
            },
          },
          {
            arrayFilters: [
              { 'dateElem.date': bookDate },
              { 'slotElem.time': booking.timeSlot },
            ],
          }
        );
      }
    }
    console.log('✅ Updated slot availability for seeded bookings');
    console.log('\n🚀 Database seeded successfully!');
    console.log('📧 Test emails: rohit@example.com, divya@example.com, amit@example.com');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
