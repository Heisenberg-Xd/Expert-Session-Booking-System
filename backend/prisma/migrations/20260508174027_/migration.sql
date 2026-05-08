-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Technology', 'Business', 'Health', 'Education', 'Design');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Expert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "experience" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "bio" TEXT NOT NULL,
    "profileImage" TEXT,
    "hourlyRate" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "expertName" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expert_category_idx" ON "Expert"("category");

-- CreateIndex
CREATE INDEX "Expert_rating_idx" ON "Expert"("rating");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_expertId_idx" ON "AvailabilitySlot"("expertId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_expertId_date_idx" ON "AvailabilitySlot"("expertId", "date");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_isBooked_idx" ON "AvailabilitySlot"("isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_expertId_date_timeSlot_key" ON "AvailabilitySlot"("expertId", "date", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Booking_userEmail_idx" ON "Booking"("userEmail");

-- CreateIndex
CREATE INDEX "Booking_expertId_idx" ON "Booking"("expertId");

-- CreateIndex
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_expertId_bookingDate_idx" ON "Booking"("expertId", "bookingDate");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
