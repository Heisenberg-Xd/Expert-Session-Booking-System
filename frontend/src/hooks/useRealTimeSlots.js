// hooks/useRealTimeSlots.js
// Custom hook that connects to the expert's Socket.io room and patches
// local slot state in real-time when another user books the same slot.
import { useEffect, useCallback } from 'react';
import { connectSocket, getSocket } from '../services/socket';

/**
 * @param {string} expertId - The expert's MongoDB ObjectId
 * @param {Function} onSlotBooked - Callback({ expertId, bookingDate, timeSlot })
 *                                  Called when a real-time slot-booked event arrives.
 * @param {Function} onStatusUpdated - Callback({ bookingId, status })
 *                                     Called when booking status changes.
 */
const useRealTimeSlots = (expertId, onSlotBooked, onStatusUpdated) => {
  const handleSlotBooked = useCallback((data) => {
    if (data.expertId === expertId) {
      onSlotBooked?.(data);
    }
  }, [expertId, onSlotBooked]);

  const handleStatusUpdated = useCallback((data) => {
    onStatusUpdated?.(data);
  }, [onStatusUpdated]);

  useEffect(() => {
    if (!expertId) return;

    const socket = connectSocket();

    // Join the expert's room to receive targeted slot updates
    socket.emit('join-expert-room', expertId);
    socket.on('slot-booked', handleSlotBooked);
    socket.on('booking-status-updated', handleStatusUpdated);

    return () => {
      // Clean up: leave the room and remove listeners to prevent memory leaks
      socket.emit('leave-expert-room', expertId);
      socket.off('slot-booked', handleSlotBooked);
      socket.off('booking-status-updated', handleStatusUpdated);
    };
  }, [expertId, handleSlotBooked, handleStatusUpdated]);
};

export default useRealTimeSlots;
