import { apiGet, apiPost, apiPut } from '@/services/apiClient';
import { Booking, Location, Vehicle } from '@/types';
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';


interface BookingContextType {
  currentBooking: Booking | null;
  confirmedBookings: Booking[];
  bookingHistory: Booking[];
  createBooking: (
    user: any,
    startLocation: Location,
    endLocation: Location,
    vehicle: Vehicle,
    fare: number,
    pickupInstructions?: string,
    pickupOption?: 'now' | 'schedule',
    pickupDate?: Date | null,
    pickupTime?: Date | null,
    roundTrip?: boolean
  ) => Promise<boolean>;
  calculateFare: (start: Location, end: Location, vehicle: Vehicle) => number;
  updatePickupInstructions: (bookingId: string, instructions: string) => Promise<boolean>;
  rateBooking: (bookingId: string, rating: number, feedback: string) => Promise<boolean>;
  fetchConfirmedBookings: () => Promise<void>;
  fetchBookingHistory: () => Promise<void>;
  setCurrentBooking: (booking: Booking | null) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
const { isLoggedIn, user } = useAuth();
  const createBooking = async (
    user: any,
    startLocation: Location,
    endLocation: Location,
    vehicle: Vehicle,
    fare: number,
    pickupInstructions?: string,
    pickupOption?: 'now' | 'schedule',
    pickupDate?: Date | null,
    pickupTime?: Date | null,
    roundTrip?: boolean
  ): Promise<boolean> => {
    try {
      // const bookingData = {
      //   startLocation,
      //   endLocation,
      //   vehicleId: vehicle.id,
      //   vehicleType: vehicle.type,
      //   pickupInstructions,
      //   fare: calculateFare(startLocation, endLocation, vehicle),
      //   pickupOption,
      //   pickupDate,
      //   pickupTime
      // };

      // Use the specified API endpoint for booking confirmation

      // date format: YYYY-MM-DD
      const formatDate = (date: Date | null | undefined): string => {
        const d = date || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatTime = (date: Date | null | undefined): string => {
        const d = date || new Date();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

       const payload = {
        customer_id: user.customer_id,
        start_point: startLocation.name,
        end_point: endLocation.name,
        vehicle_type: vehicle.type,
        total_amount: fare.toString(),
        date_of_travel: formatDate(pickupDate),
        pickup_time: formatTime(pickupTime),
        ride_instructions: pickupInstructions || '',
      };
      // console.log("Booking payload:", payload);

      const response = await apiPost('/api/book_ride/', payload);
      if (response.status === 201 && response.data.status === "success") {
        const bookingdata = {
          startLocation,
          endLocation,
          vehicle,
          fare,
          pickupInstructions,
          pickupOption,
          pickupDate,
          pickupTime,
          roundTrip
        }
        setCurrentBooking(bookingdata);
        // console.log('Booking created successfully:', response.data);
      }

      // Create mock booking for demo
      // const mockBooking: Booking = {
      //   id: Date.now().toString(),
      //   userId: '1',
      //   startLocation,
      //   endLocation,
      //   vehicle,
      //   fare: calculateFare(startLocation, endLocation, vehicle),
      //   status: 'confirmed',
      //   createdAt: new Date().toISOString(),
      //   pickupInstructions,
      //   amountPending: calculateFare(startLocation, endLocation, vehicle),
      //   amountPaid: 0,
      //   driver: {
      //     id: '1',
      //     name: 'Rajesh Kumar',
      //     phone: '+91 9876543210',
      //     carNumber: 'KA-01-AB-1234',
      //     rating: 4.8,
      //     latitude: startLocation.latitude + 0.01,
      //     longitude: startLocation.longitude + 0.01,
      //   },
      // };

      
      return true;
    } catch (error) {
      console.error('Create booking error:', error);
      // console.log('API booking failed, creating mock booking for demo');
      
      // Create mock booking even if API fails (for demo purposes)
      // const mockBooking: Booking = {
      //   id: Date.now().toString(),
      //   userId: '1',
      //   startLocation,
      //   endLocation,
      //   vehicle,
      //   fare: calculateFare(startLocation, endLocation, vehicle),
      //   status: 'confirmed',
      //   createdAt: new Date().toISOString(),
      //   pickupInstructions,
      //   amountPending: calculateFare(startLocation, endLocation, vehicle),
      //   amountPaid: 0,
      //   driver: {
      //     id: '1',
      //     name: 'Rajesh Kumar',
      //     phone: '+91 9876543210',
      //     carNumber: 'KA-01-AB-1234',
      //     rating: 4.8,
      //     latitude: startLocation.latitude + 0.01,
      //     longitude: startLocation.longitude + 0.01,
      //   },
      // };

      // setCurrentBooking(mockBooking);
      return false;
    }
  };

  const calculateFare = (start: Location, end: Location, vehicle: Vehicle): number => {
    // Haversine formula for distance calculation
    const lat1 = start.latitude;
    const lon1 = start.longitude;
    const lat2 = end.latitude;
    const lon2 = end.longitude;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.sqrt(
      Math.pow(end.latitude - start.latitude, 2) +
      Math.pow(end.longitude - start.longitude, 2)
    ) * 111; // Rough conversion to km for fallback
    
    const actualDistance = R * c; // More accurate distance in km
    const finalDistance = actualDistance > 0 ? actualDistance : distance;
    
    const baseFare = 50;
    const driverFee = 20;
    const tollAmount = finalDistance > 10 ? 40 : 0;
    const distanceFare = finalDistance * vehicle.pricePerKm;
    
    return Math.round((baseFare + distanceFare + driverFee + tollAmount) * 100) / 100;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const updatePickupInstructions = async (bookingId: string, instructions: string): Promise<boolean> => {
    try {
      await apiPut(`/api/bookings/${bookingId}/instructions`, { instructions });
      
      if (currentBooking && currentBooking.id === bookingId) {
        setCurrentBooking({
          ...currentBooking,
          pickupInstructions: instructions,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Update instructions error:', error);
      return false;
    }
  };

  const rateBooking = async (bookingId: string, rating: number, feedback: string): Promise<boolean> => {
    try {
      await apiPost(`/api/bookings/${bookingId}/feedback`, { rating, feedback });
      
      // Update local state
      const updateBooking = (booking: Booking) =>
        booking.id === bookingId ? { ...booking, rating, feedback } : booking;
      
      setConfirmedBookings(prev => prev.map(updateBooking));
      setBookingHistory(prev => prev.map(updateBooking));
      
      return true;
    } catch (error) {
      console.error('Rate booking error:', error);
      return false;
    }
  };

  const fetchConfirmedBookings = async (): Promise<void> => {
    try {
      const response = await apiGet(`/api/list_rides_by_customer/${user.customer_id}`);
      // console.log("Confirmed bookings response:", response.data.rides);
      setConfirmedBookings(response.data.rides);
    } catch (error) {
      console.error('Fetch confirmed bookings error:', error);
      // Mock data for demo
      setConfirmedBookings([]);
    }
  };

  const fetchBookingHistory = async (): Promise<void> => {
    try {
      const response = await apiGet(`/api/list_closed_rides_by_customer/${user.customer_id}`);
      setBookingHistory(response.data.closed_rides);
    } catch (error) {
      console.error('Fetch booking history error:', error);
      // Mock data for demo
      setBookingHistory([]);
    }
  };

  return (
    <BookingContext.Provider value={{
      currentBooking,
      confirmedBookings,
      bookingHistory,
      createBooking,
      updatePickupInstructions,
      rateBooking,
      fetchConfirmedBookings,
      fetchBookingHistory,
      setCurrentBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};