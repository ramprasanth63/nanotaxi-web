import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { apiGet } from '@/services/apiClient';
import { Booking } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const LatestOrderCard = ({ fetchLatestBooking, latestBooking, latestBookingType, onRefresh, refreshing }) => {
  const router = useRouter();
  
  // Helper function to normalize the data structure
  const normalizeBookingData = (booking) => {
    if (!booking) return null;
    
    // Check if it's the first format (form data)
    if (booking.startLocation && booking.endLocation) {
      return {
        id: booking.id || 'temp-id',
        start_point: booking.startLocation.name,
        end_point: booking.endLocation.name,
        vehicle_type: booking.vehicle?.type || 'MINI',
        date_of_travel: booking.pickupDate ? new Date(booking.pickupDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        pickup_time: booking.pickupTime ? new Date(booking.pickupTime).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : null,
        pending_payment: booking.fare ? booking.fare.toString() : '0',
        total_amount: booking.fare ? booking.fare.toString() : '0',
        is_confirmed: false,
        status: 'pending',
        created_at: new Date().toISOString(),
        customer_contact: null,
        ride_instructions: booking.pickupInstructions || '',
        is_ride_closed: booking.is_ride_closed || false,
      };
    }
    
    return booking;
  };

  const normalizedBooking = normalizeBookingData(latestBooking);

  if (!normalizedBooking) {
    return (
      <View style={styles.latestOrderCard}>
        <View style={styles.latestOrderHeader}>
          <View>
            <Text style={styles.latestOrderTitle}>Latest Booking</Text>
            <Text style={styles.noOrderText}>No recent bookings</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={() => fetchLatestBooking()}
            disabled={refreshing}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#9CA3AF" : "#10B981"}
              style={refreshing && styles.refreshIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (latestBookingType === "packageTrip") {
    return (
      <View style={styles.latestOrderCard}>
        <View style={styles.latestOrderHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.latestOrderTitle}>Latest Package Trip</Text>
            <View style={styles.orderMeta}>
              <View style={styles.orderStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(latestBooking.is_closed, latestBooking.is_confirmed, 'package') }
                ]} />
                <Text style={[
                  styles.statusLabel,
                  { color: getStatusColor(latestBooking.is_closed, latestBooking.is_confirmed, 'package') }
                ]}>
                  {latestBooking.is_closed ? 'COMPLETED' : latestBooking.is_confirmed ? 'CONFIRMED' : 'PENDING'}
                </Text>
              </View>
              <Text style={styles.orderDate}>
                {formatRelativeTime(latestBooking.created_at)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={() => fetchLatestBooking()}
            disabled={refreshing}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#9CA3AF" : "#10B981"}
              style={refreshing && styles.refreshIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.orderRoute}>
          <View style={styles.routePoint}>
            <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
            <Text style={styles.routePointText} numberOfLines={1}>
              {latestBooking.pick_up_place}
            </Text>
          </View>
          {/* <View style={styles.routeConnector}>
            <View style={styles.routeDots}>
              <View style={styles.routeDot} />
              <View style={styles.routeDot} />
              <View style={styles.routeDot} />
            </View>
            <MaterialCommunityIcons name="arrow-right" size={12} color="#6B7280" />
          </View>
          <View style={styles.routePoint}>
            <MaterialCommunityIcons name="map-marker" size={8} color="#EF4444" />
            <Text style={styles.routePointText} numberOfLines={1}>
              {latestBooking.pick_up_address}
            </Text>
          </View> */}
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{latestBooking.vehicle_type}</Text>
          </View>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {new Date(latestBooking.date_of_travel).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
          {latestBooking.pickup_time && (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>{latestBooking.pickup_time}</Text>
            </View>
          )}
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#10B981" />
            <Text style={[styles.orderDetailText, { color: '#10B981', fontWeight: '600' }]}>
              {latestBooking.pending_payment || latestBooking.total_amount}
            </Text>
          </View>
        </View>

        <View style={styles.packageDetails}>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="road-variant" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {latestBooking.total_km_booked} km
            </Text>
          </View>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {latestBooking.total_hours_booked} hrs
            </Text>
          </View>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {latestBooking.no_of_nights} night(s)
            </Text>
          </View>
        </View>

        <View style={styles.packageCostDetails}>
          {latestBooking.base_amount && latestBooking.base_amount > 0 && (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="cash" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>
                Base: ₹{latestBooking.base_amount}
              </Text>
            </View>
          )}
          {latestBooking.toll_amount && latestBooking.toll_amount > 0 && (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>
                Toll: ₹{latestBooking.toll_amount}
              </Text>
            </View>
          )}
          {latestBooking.parking_fee && latestBooking.parking_fee > 0 && (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="parking" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>
                Parking: ₹{latestBooking.parking_fee}
              </Text>
            </View>
          )}
          {latestBooking.night_halt_charges && latestBooking.night_halt_charges > 0 && (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>
                Night Halt: ₹{latestBooking.night_halt_charges}
              </Text>
            </View>
          )}
        </View>

        {latestBooking.special_instructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Special Instructions:</Text>
            <Text style={styles.instructionsText}>{latestBooking.special_instructions}</Text>
          </View>
        )}

        <View style={styles.quickActions}>
          {latestBooking.is_closed && (
            <TouchableOpacity style={styles.primaryAction}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
              <Text style={styles.primaryActionText}>Trip Completed</Text>
            </TouchableOpacity>
          )}
          {!latestBooking.is_closed && latestBooking.is_confirmed && (
            <TouchableOpacity style={styles.primaryAction}>
              <MaterialCommunityIcons name="car" size={16} color="#ffffff" />
              <Text style={styles.primaryActionText}>Driver Assigned</Text>
            </TouchableOpacity>
          )}
          {!latestBooking.is_closed && !latestBooking.is_confirmed && (
            <TouchableOpacity style={styles.secondaryAction}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
              <Text style={styles.secondaryActionText}>Waiting for Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.latestOrderCard}>
      <View style={styles.latestOrderHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.latestOrderTitle}>Latest Booking</Text>
          <View style={styles.orderMeta}>
            <View style={styles.orderStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(normalizedBooking.is_confirmed, normalizedBooking.status) }
              ]} />
              <Text style={[
                styles.statusLabel,
                { color: getStatusColor(normalizedBooking.is_ride_closed, normalizedBooking.is_confirmed, normalizedBooking.status) }
              ]}>
                {getStatusText(normalizedBooking.is_ride_closed, normalizedBooking.is_confirmed, normalizedBooking.status)}
              </Text>
            </View>
            <Text style={styles.orderDate}>
              {formatRelativeTime(normalizedBooking.created_at)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
          onPress={fetchLatestBooking}
          disabled={refreshing}
        >
          <MaterialCommunityIcons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#9CA3AF" : "#10B981"}
            style={refreshing && styles.refreshIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.orderRoute}>
        <View style={styles.routePoint}>
          <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
          <Text style={styles.routePointText} numberOfLines={1}>
            {normalizedBooking.start_point}
          </Text>
        </View>
        <View style={styles.routeConnector}>
          <View style={styles.routeDots}>
            <View style={styles.routeDot} />
            <View style={styles.routeDot} />
            <View style={styles.routeDot} />
          </View>
          <MaterialCommunityIcons name="arrow-right" size={12} color="#6B7280" />
        </View>
        <View style={styles.routePoint}>
          <MaterialCommunityIcons name="map-marker" size={8} color="#EF4444" />
          <Text style={styles.routePointText} numberOfLines={1}>
            {normalizedBooking.end_point}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>{normalizedBooking.vehicle_type}</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>
            {new Date(normalizedBooking.date_of_travel).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short'
            })}
          </Text>
        </View>
        {normalizedBooking.pickup_time && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{normalizedBooking.pickup_time}</Text>
          </View>
        )}
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="currency-inr" size={16} color="#10B981" />
          <Text style={[styles.orderDetailText, { color: '#10B981', fontWeight: '600' }]}>
            {normalizedBooking.pending_payment || normalizedBooking.total_amount}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        {normalizedBooking?.is_ride_closed && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Ride Completed</Text>
          </TouchableOpacity>
        )}

        {!normalizedBooking?.is_ride_closed && normalizedBooking.status === 'Started' && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Track Now</Text>
          </TouchableOpacity>
        )}

        {(normalizedBooking.is_confirmed === 'true' || normalizedBooking.is_confirmed === true) && normalizedBooking.status !== 'Started' && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Driver Assigned</Text>
          </TouchableOpacity>
        )}

        {(normalizedBooking.is_confirmed === 'false' || normalizedBooking.is_confirmed === false) && (
          <TouchableOpacity style={styles.secondaryAction}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
            <Text style={styles.secondaryActionText}>Waiting for Driver</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper functions
const getStatusColor = (is_ride_closed, confirmed, status) => {
  if (is_ride_closed) return '#6B7280';
  if (status === 'Started') return '#3B82F6';
  if (confirmed === 'true' || confirmed === true) return '#10B981';
  if (confirmed === 'false' || confirmed === false) return '#F59E0B';
  return '#6B7280';
};

const getStatusText = (is_ride_closed, confirmed, status) => {
  if (is_ride_closed) return 'COMPLETED';
  if (status === 'Started') return 'ONGOING';
  if (confirmed === 'true' || confirmed === true) return 'CONFIRMED';
  if (confirmed === 'false' || confirmed === false) return 'PENDING';
  return 'UNKNOWN';
};

const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export default function BookingsScreen() {
  const router = useRouter();
  const { confirmedBookings, fetchConfirmedBookings, updatePickupInstructions, currentBooking } = useBooking();
  const { isLoggedIn, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('current');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [instructionsText, setInstructionsText] = useState('');
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [latestBookingType, setLatestBookingType] = useState();
  const [refreshingLatest, setRefreshingLatest] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchConfirmedBookings();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchLatestBooking();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConfirmedBookings();
    setRefreshing(false);
  };

  const handleEditInstructions = (booking: Booking) => {
    setSelectedBooking(booking);
    setInstructionsText(booking.ride_instructions || booking.pickupInstructions || '');
    setShowInstructionsModal(true);
  };

  const handleSaveInstructions = () => {
    if (selectedBooking) {
      updatePickupInstructions(selectedBooking.id, instructionsText);
      setShowInstructionsModal(false);
      setSelectedBooking(null);
      setInstructionsText('');
    }
  };

  const handleCancelInstructions = () => {
    setShowInstructionsModal(false);
    setSelectedBooking(null);
    setInstructionsText('');
  };

  const normalizeBookingData = (booking) => {
    if (!booking) return null;
    
    if (booking.startLocation && booking.endLocation) {
      return {
        id: booking.id || 'temp-id',
        start_point: booking.startLocation.name,
        end_point: booking.endLocation.name,
        vehicle_type: booking.vehicle?.type || 'MINI',
        date_of_travel: booking.pickupDate ? new Date(booking.pickupDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        pickup_time: booking.pickupTime ? new Date(booking.pickupTime).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : null,
        pending_payment: booking.fare ? booking.fare.toString() : '0',
        total_amount: booking.fare ? booking.fare.toString() : '0',
        is_confirmed: false,
        status: 'pending',
        created_at: new Date().toISOString(),
        customer_contact: null,
        ride_instructions: booking.pickupInstructions || '',
        is_ride_closed: booking.is_ride_closed || false,
      };
    }
    
    return booking;
  };

  const fetchLatestBooking = async () => {
    try {
      setRefreshingLatest(true);
      const response = await apiGet(`/api/list_rides_by_customer/${user.customer_id}`);
      if (response.data && response.data.rides.length > 0) {
        
        const latestRawBooking = response.data.rides.reduce((latestSoFar, current) => {
          const latestDate = new Date(latestSoFar?.created_at || latestSoFar?.date_of_travel || 0);
          const currentDate = new Date(current?.created_at || current?.date_of_travel || 0);
          return currentDate > latestDate ? current : latestSoFar;
        }, null as any);
        
        const package_response = await apiGet(`/api/list_package_rides_by_customer/${user.customer_id}`);

        const latestPackageBooking = package_response.data.package_rides.reduce((latestSoFar, current) => {
          const latestDate = new Date(latestSoFar?.created_at || latestSoFar?.date_of_travel || 0);
          const currentDate = new Date(current?.created_at || current?.date_of_travel || 0);
          return currentDate > latestDate ? current : latestSoFar;
        }, null as any);

        let latestBookingData = null;
        let latestType = null;

        if (latestRawBooking && latestPackageBooking) {
          const rawDate = new Date(latestRawBooking?.created_at || latestRawBooking?.date_of_travel || 0);
          const packageDate = new Date(latestPackageBooking?.created_at || latestPackageBooking?.date_of_travel || 0);
          if (packageDate > rawDate) {
            latestBookingData = latestPackageBooking;
            latestType = 'packageTrip';
          } else {
            latestBookingData = latestRawBooking;
            latestType = 'singleTrip';
          }
        } else if (latestRawBooking) {
          latestBookingData = latestRawBooking;
          latestType = 'singleTrip';
        } else if (latestPackageBooking) {
          latestBookingData = latestPackageBooking;
          latestType = 'packageTrip';
        }

        setLatestBookingType(latestType);
        const latestBooking = latestType === 'singleTrip' ? normalizeBookingData(latestBookingData) : latestBookingData;
        setLatestBooking(latestBooking);
      }
    } catch (error) {
      console.error("Error fetching latest booking:", error);
    } finally {
      setRefreshingLatest(false);
    }
  };

  const allBookings = useMemo(() => {
    const bookings = [...confirmedBookings];
    if (currentBooking) {
      bookings.unshift(currentBooking);
    }
    return bookings;
  }, [confirmedBookings, currentBooking]);

  const filteredBookings = useMemo(() => {
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed);
    switch (viewMode) {
      case 'current':
        return activeBookings.filter(booking => booking.status === 'Started' && !booking.is_ride_closed);
      case 'accepted':
        return activeBookings.filter(booking => booking.is_confirmed === 'true' || booking.is_confirmed === true && !booking.is_ride_closed);
      case 'pending':
        return activeBookings.filter(booking => booking.is_confirmed === 'false' || booking.is_confirmed === false && !booking.is_ride_closed);
      default:
        return activeBookings;
    }
  }, [allBookings, viewMode]);

  const getToggleCount = (mode: string) => {
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed);
    
    switch (mode) {
      case 'current':
        return activeBookings.filter(booking => booking.status === 'Started').length;
      case 'accepted':
        return activeBookings.filter(booking => booking.is_confirmed === 'true' || booking.is_confirmed === true).length;
      case 'pending':
        return activeBookings.filter(booking => booking.is_confirmed === 'false' || booking.is_confirmed === false).length;
      default:
        return 0;
    }
  };

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(booking.is_confirmed, booking.status) }
          ]} />
          <Text style={[styles.statusText, { color: getStatusColor(booking.is_confirmed, booking.status) }]}>
            {getStatusText(booking.is_confirmed, booking.status)}
          </Text>
        </View>
        <Text style={styles.bookingDate}>
          {new Date(booking.date_of_travel).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
          <Text style={styles.routeText}>{booking.start_point}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
          <Text style={styles.routeText}>{booking.end_point}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.vehicle_type}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailText}>₹{booking.pending_payment}</Text>
        </View>
        {booking.pickup_time && (
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{booking.pickup_time}</Text>
          </View>
        )}
      </View>

      {/* Show driver info for current trips or accepted trips */}
      {(booking.status === 'started' || (booking.is_confirmed === 'true' || booking.is_confirmed === true)) && booking.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{booking.driver.name}</Text>
          <Text style={styles.driverDetails}>
            {booking.driver.carNumber} • ⭐ {booking.driver.rating}
          </Text>
          <Text style={styles.driverPhone}>{booking.driver.phone}</Text>
        </View>
      )}

      {(booking.ride_instructions || booking.pickupInstructions) && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Pickup Instructions:</Text>
          <Text style={styles.instructionsText}>
            {booking.ride_instructions || booking.pickupInstructions}
          </Text>
        </View>
      )}

      <View style={styles.paymentInfo}>
        <View style={styles.paymentItem}>
          <Text style={styles.paymentLabel}>Amount Paid:</Text>
          <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
            ₹{booking.advanced_payment}
          </Text>
        </View>
        {booking.pending_payment > 0 && (
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Amount Pending:</Text>
            <Text style={[styles.paymentAmount, { color: '#EF4444' }]}>
              ₹{booking.pending_payment}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        {/* <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditInstructions(booking)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Edit Instructions</Text>
        </TouchableOpacity> */}
        
        {booking.status === 'started' && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push('/tracking')}
          >
            <Text style={styles.trackButtonText}>Track Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (confirmed: any, status?: string) => {
    if (status === 'started') return '#3B82F6';
    if (confirmed === 'true' || confirmed === true) return '#10B981';
    if (confirmed === 'false' || confirmed === false) return '#F59E0B';
    return '#6B7280';
  };

  const getStatusText = (confirmed: any, status?: string) => {
    if (status === 'started') return 'CURRENT TRIP';
    if (confirmed === 'true' || confirmed === true) return 'CONFIRMED';
    if (confirmed === 'false' || confirmed === false) return 'PENDING';
    return 'UNKNOWN';
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Login Required</Text>
          <Text style={styles.emptyStateText}>
            Please login to view your bookings
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <Text style={styles.headerSubtitle}>Track your current and upcoming rides</Text>
      </View>

      <LatestOrderCard 
        fetchLatestBooking={fetchLatestBooking}
        latestBooking={latestBooking}
        latestBookingType={latestBookingType}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'current' ? styles.activeToggle : styles.inactiveToggle
          ]}
          onPress={() => setViewMode('current')}
        >
          <Text style={[
            styles.toggleText,
            viewMode === 'current' ? styles.activeToggleText : styles.inactiveToggleText
          ]}>
            Current Trip ({getToggleCount('current')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'accepted' ? styles.activeToggle : styles.inactiveToggle
          ]}
          onPress={() => setViewMode('accepted')}
        >
          <Text style={[
            styles.toggleText,
            viewMode === 'accepted' ? styles.activeToggleText : styles.inactiveToggleText
          ]}>
            Driver Accepted ({getToggleCount('accepted')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'pending' ? styles.activeToggle : styles.inactiveToggle
          ]}
          onPress={() => setViewMode('pending')}
        >
          <Text style={[
            styles.toggleText,
            viewMode === 'pending' ? styles.activeToggleText : styles.inactiveToggleText
          ]}>
            Yet to Accept ({getToggleCount('pending')})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {viewMode === 'current' && 'No Current Trips'}
              {viewMode === 'accepted' && 'No Driver Accepted Trips'}
              {viewMode === 'pending' && 'No Pending Trips'}
            </Text>
            <Text style={styles.emptyStateText}>
              {viewMode === 'current' && 'You don\'t have any ongoing rides'}
              {viewMode === 'accepted' && 'No confirmed rides by drivers yet'}
              {viewMode === 'pending' && 'No trips waiting for driver acceptance'}
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/booking/location')}
            >
              <Text style={styles.bookButtonText}>Book a Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>

      <Modal
        visible={showInstructionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelInstructions}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Pickup Instructions</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelInstructions}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Add specific instructions for the driver to find you easily
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="e.g., I'll be waiting near the main gate, wearing a blue shirt..."
              value={instructionsText}
              onChangeText={setInstructionsText}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelInstructions}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveInstructions}
              >
                <Text style={styles.saveButtonText}>Save Instructions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#10B981',
  },
  inactiveToggle: {
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeToggleText: {
    color: 'white',
  },
  inactiveToggleText: {
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginLeft: 8,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  driverInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1D4ED8',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentItem: {
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  trackButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Latest Order Card Styles
  latestOrderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 20,
  },
  latestOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  latestOrderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  refreshButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  refreshIcon: {
    transform: [{ rotate: '180deg' }],
  },
  noOrderText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  orderRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePointText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  routeDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  routeDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 1,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  outlineAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Package-specific styles
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  packageCostDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
  },
});