import TaxiLoading from '@/components/TaxiLoading';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { apiGet } from '@/services/apiClient';
import { Booking } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Car, Phone, User } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Replace the existing LatestOrderCard with this cleaned version
const LatestOrderCard = ({ fetchLatestBooking, latestBooking: rawLatestBooking, latestBookingType, onRefresh, refreshing }) => {
  const router = useRouter();

  // Local normalizer (returns consistent boolean flags)
  const normalizeBookingDataLocal = (booking) => {
    if (!booking) return null;

    // treat both 'true'/'false' strings and booleans
    const isConfirmed = booking.is_confirmed === true || booking.is_confirmed === 'true';
    const isClosed = !!(booking.is_ride_closed || booking.is_closed);

    // If booking has form-like fields (startLocation)
    if (booking.startLocation || booking.endLocation) {
      return {
        id: booking.id || 'temp-id',
        start_point: booking.startLocation?.name || booking.start_point || '',
        end_point: booking.endLocation?.name || booking.end_point || '',
        vehicle_type: booking.vehicle?.type || booking.vehicle_type || 'MINI',
        date_of_travel: booking.pickupDate || booking.date_of_travel || new Date().toISOString(),
        pickup_time: booking.pickupTime || booking.pickup_time || null,
        pending_payment: (booking.fare ? String(booking.fare) : booking.pending_payment) || '0',
        total_amount: booking.total_amount || booking.fare || '0',
        is_confirmed: isConfirmed,
        status: booking.status || 'pending',
        created_at: booking.created_at || new Date().toISOString(),
        ride_instructions: booking.pickupInstructions || booking.ride_instructions || '',
        is_ride_closed: isClosed,
        round_trip: booking.round_trip || false,
        trip_type: booking.trip_type || 'single'
      };
    }

    // fallback: return booking with normalized flags
    return {
      ...booking,
      is_confirmed: isConfirmed,
      is_ride_closed: isClosed,
      status: booking.status || 'pending'
    };
  };

  // local helpers (avoid name collisions with other defs)
  const localGetStatusColor = (isClosed, isConfirmed, status) => {
    if (isClosed) return '#6B7280';
    if (status === 'Started' || status === 'started') return '#3B82F6';
    if (isConfirmed === true) return '#10B981';
    if (isConfirmed === false) return '#F59E0B';
    return '#6B7280';
  };

  const localGetStatusText = (isClosed, isConfirmed, status) => {
    if (isClosed) return 'COMPLETED';
    if (status === 'Started' || status === 'started') return 'ONGOING';
    if (isConfirmed === true) return 'CONFIRMED';
    if (isConfirmed === false) return 'PENDING';
    return 'UNKNOWN';
  };

  const localFormatRelativeTime = (dateString) => {
    if (!dateString) return '';
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

  // produce normalized booking used by this card
  const latestBooking = rawLatestBooking
    ? (latestBookingType === 'singleTrip' ? normalizeBookingDataLocal(rawLatestBooking) : normalizeBookingDataLocal(rawLatestBooking))
    : null;

  // --- Render when no latest booking ---
  if (!latestBooking) {
    return (
      <View style={styles.latestOrderCard}>
        <View style={styles.latestOrderHeader}>
          <View>
            <Text style={styles.latestOrderTitle}>Latest Booking</Text>
            <Text style={styles.noOrderText}>No recent bookings</Text>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={async () => {
              console.log("=== REFRESH BUTTON PRESSED ===");
              console.log("onRefresh exists:", !!onRefresh);
              console.log("refreshing state:", refreshing);

              try {
                if (onRefresh) {
                  console.log("Calling onRefresh...");
                  await onRefresh();
                  console.log("onRefresh completed");
                } else {
                  console.log("onRefresh function not provided!");
                }
              } catch (error) {
                console.error('Error in button press:', error);
              }
            }}
            disabled={refreshing}
            accessibilityLabel="Refresh latest booking"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={refreshing ? "#9CA3AF" : "#10B981"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Package Trip card ---
  if (latestBookingType === "packageTrip") {
    const isClosed = !!latestBooking.is_closed || !!latestBooking.is_ride_closed;
    const isConfirmed = !!latestBooking.is_confirmed;
    const isStarted = (latestBooking.status === 'Started' || latestBooking.status === 'started') ? true : false;

    return (
      <View style={styles.latestOrderCard}>
        <View style={styles.latestOrderHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.latestOrderTitle}>Latest Package Trip</Text>

            <View style={styles.orderMeta}>
              <View style={styles.orderStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: localGetStatusColor(isClosed, isConfirmed, latestBooking.status) }
                ]} />
                <Text style={[
                  styles.statusLabel,
                  { color: localGetStatusColor(isClosed, isConfirmed, latestBooking.status) }
                ]}>
                  {isClosed ? 'COMPLETED' : isConfirmed ? 'CONFIRMED' : 'PENDING'}
                </Text>
              </View>

              <Text style={styles.orderDate}>{localFormatRelativeTime(latestBooking.created_at)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={async () => {
              console.log("=== REFRESH BUTTON PRESSED ===");
              console.log("onRefresh exists:", !!onRefresh);
              console.log("refreshing state:", refreshing);

              try {
                if (onRefresh) {
                  console.log("Calling onRefresh...");
                  await onRefresh();
                  console.log("onRefresh completed");
                } else {
                  console.log("onRefresh function not provided!");
                }
              } catch (error) {
                console.error('Error in button press:', error);
              }
            }}
            disabled={refreshing}
            accessibilityLabel="Refresh latest booking"
          >
            <MaterialCommunityIcons name="refresh" size={20} color={refreshing ? "#9CA3AF" : "#10B981"} />
          </TouchableOpacity>
        </View>

        <View style={styles.orderRoute}>
          <View style={styles.routePoint}>
            <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
            <Text style={styles.routePointText} numberOfLines={1}>{String(latestBooking.pick_up_place || latestBooking.start_point || '')}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{String(latestBooking.vehicle_type || '')}</Text>
          </View>

          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {new Date(latestBooking.date_of_travel).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {latestBooking.pickup_time ? (
            <View style={styles.orderDetailItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
              <Text style={styles.orderDetailText}>{String(latestBooking.pickup_time)}</Text>
            </View>
          ) : null}

          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#10B981" />
            <Text style={[styles.orderDetailText, { color: '#10B981', fontWeight: '600' }]}>
              {String(latestBooking.pending_payment || latestBooking.total_amount || '0')}
            </Text>
          </View>
        </View>

        {/* package summary */}
        <View style={styles.packageDetails}>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="road-variant" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{String(latestBooking.total_km_booked || 0)} km</Text>
          </View>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{String(latestBooking.total_hours_booked || 0)} hrs</Text>
          </View>
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{String(latestBooking.no_of_nights || 0)} night(s)</Text>
          </View>
        </View>

        {latestBooking.special_instructions ? (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Special Instructions:</Text>
            <Text style={styles.instructionsText}>{String(latestBooking.special_instructions)}</Text>
          </View>
        ) : null}

        <View style={styles.quickActions}>
          {isClosed ? (
            <TouchableOpacity style={styles.primaryAction}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
              <Text style={styles.primaryActionText}>Trip Completed</Text>
            </TouchableOpacity>
          ) : isStarted ?
            (
              <TouchableOpacity style={styles.primaryAction}>
                <MaterialCommunityIcons name="car" size={16} color="#ffffff" />
                <Text style={styles.primaryActionText}>Trip Started</Text>
              </TouchableOpacity>
            )
            : isConfirmed ? (
              <TouchableOpacity style={styles.primaryAction}>
                <MaterialCommunityIcons name="car" size={16} color="#ffffff" />
                <Text style={styles.primaryActionText}>Driver Confirmed</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryAction}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
                <Text style={styles.secondaryActionText}>Waiting for Driver</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  }

  // --- Single trip / round trip card ---
  const nb = latestBooking; // normalized booking for readability
  const nbClosed = !!nb.is_ride_closed;
  const nbConfirmed = !!nb.is_confirmed;

  return (
    <View style={styles.latestOrderCard}>
      <View style={styles.latestOrderHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.latestOrderTitle}>{nb.round_trip ? 'Latest Round Trip' : 'Latest Booking'}</Text>

          <View style={styles.orderMeta}>
            <View style={styles.orderStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: localGetStatusColor(nbClosed, nbConfirmed, nb.status) }
              ]} />
              <Text style={[
                styles.statusLabel,
                { color: localGetStatusColor(nbClosed, nbConfirmed, nb.status) }
              ]}>
                {localGetStatusText(nbClosed, nbConfirmed, nb.status)}
              </Text>
            </View>

            <Text style={styles.orderDate}>{localFormatRelativeTime(nb.created_at)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
          onPress={async () => {
            console.log("=== REFRESH BUTTON PRESSED ===");
            console.log("onRefresh exists:", !!onRefresh);
            console.log("refreshing state:", refreshing);

            try {
              if (onRefresh) {
                console.log("Calling onRefresh...");
                await onRefresh();
                console.log("onRefresh completed");
              } else {
                console.log("onRefresh function not provided!");
              }
            } catch (error) {
              console.error('Error in button press:', error);
            }
          }}
          disabled={refreshing}
          accessibilityLabel="Refresh latest booking"
        >
          <MaterialCommunityIcons name="refresh" size={20} color={refreshing ? "#9CA3AF" : "#10B981"} />
        </TouchableOpacity>
      </View>

      <View style={styles.orderRoute}>
        <View style={styles.routePoint}>
          <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
          <Text style={styles.routePointText} numberOfLines={1}>{String(nb.start_point || '')}</Text>
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
          <Text style={styles.routePointText} numberOfLines={1}>{String(nb.end_point || '')}</Text>
        </View>

        {nb.round_trip ? (
          <>
            <View style={styles.routeConnector}>
              <View style={styles.routeDots}>
                <View style={styles.routeDot} />
                <View style={styles.routeDot} />
                <View style={styles.routeDot} />
              </View>
              <MaterialCommunityIcons name="arrow-right" size={12} color="#6B7280" />
            </View>
            <View style={styles.routePoint}>
              <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
              <Text style={styles.routePointText} numberOfLines={1}>{String(nb.start_point || '')}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>{String(nb.vehicle_type || '')}</Text>
        </View>

        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>
            {new Date(nb.date_of_travel).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {nb.pickup_time ? (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{String(nb.pickup_time)}</Text>
          </View>
        ) : null}

        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="currency-inr" size={16} color="#10B981" />
          <Text style={[styles.orderDetailText, { color: '#10B981', fontWeight: '600' }]}>{String(nb.total_amount || 0)}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        {nb.is_ride_closed ? (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Ride Completed</Text>
          </TouchableOpacity>
        ) : nb.status === 'Started' || nb.status === 'started' ? (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Trip Started</Text>
          </TouchableOpacity>
        ) : nbConfirmed ? (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Driver Confirmed</Text>
          </TouchableOpacity>
        ) : (
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
const getStatusColor = (isClosed, isConfirmed, status) => {
  if (isClosed) return '#6B7280';
  if (status === 'Started') return '#3B82F6';
  if (isConfirmed) return '#10B981';
  if (isConfirmed === false) return '#F59E0B';
  return '#6B7280';
};

const getStatusText = (isClosed, isConfirmed, status) => {
  if (isClosed) return 'COMPLETED';
  if (status === 'Started') return 'ONGOING';
  if (isConfirmed) return 'CONFIRMED';
  if (isConfirmed === false) return 'PENDING';
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
  const [packageBookings, setPackageBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isLoggedIn && user?.customer_id) {
        setIsLoading(true);
        console.log("Starting to load initial data...");
        
        try {
          await Promise.all([
            fetchConfirmedBookings(),
            fetchPackageBookings(),
            fetchLatestBooking()
          ]);
          console.log("All initial data loaded successfully");
        } catch (error) {
          console.error("Error loading initial data:", error);
        } finally {
          setIsLoading(false);
          console.log("Initial loading completed");
        }
      } else {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isLoggedIn, user?.customer_id]);


  const fetchPackageBookings = async () => {
    console.log("=== fetchPackageBookings called ===");

    if (!user?.customer_id) { // Add this check
      console.log("No user customer_id available");
      return;
    }

    try {
      const response = await apiGet(`/api/list_package_rides_by_customer/${user.customer_id}`);
      if (response.data && response.data.package_rides) {
        // Normalize package bookings to match the expected format
        const normalizedPackageBookings = response.data.package_rides.map(pkg => ({
          ...pkg,
          id: pkg.package_ride_id,
          start_point: pkg.pick_up_place,
          end_point: pkg.pick_up_address,
          ride_instructions: pkg.special_instructions,
          is_ride_closed: pkg.is_closed,
          trip_type: 'package'
        }));
        setPackageBookings(normalizedPackageBookings);
      }
    } catch (error) {
      console.error("Error fetching package bookings:", error);
    }
  };

  const onRefresh = async () => {
    console.log("Refreshing bookings...");
    setRefreshing(true);
    try {
      await Promise.all([
        fetchLatestBooking(),
        fetchConfirmedBookings(),
        fetchPackageBookings()
      ]);
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };


  const handleDriverCall = async () => {
  const phoneNumber = '+919840407707';
  const url = `tel:${phoneNumber}`;
  
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log("Phone call not supported");
    }
  } catch (error) {
    console.error('Error making phone call:', error);
  }
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

    const isConfirmed = booking.is_confirmed === true || booking.is_confirmed === 'true';
    const isClosed = booking.is_ride_closed || booking.is_closed || false;

    return {
      ...booking,
      is_confirmed: isConfirmed,
      is_ride_closed: isClosed,
      status: booking.status || 'pending'
    };
  };

  const fetchLatestBooking = async () => {
    console.log("=== fetchLatestBooking called ===");

    if (!user?.customer_id) { // Add this check
      console.log("No user customer_id available");
      return;
    }

    try {
      setRefreshingLatest(true);
      const response = await apiGet(`/api/list_rides_by_customer/${user.customer_id}`);
      if (response.data && response.data.rides.length > 0) {
        console.log("Raw bookings fetched:", response.data.rides);

        // Find the latest raw booking
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

    // Add package bookings
    const normalizedPackageBookings = packageBookings.map(pkg => ({
      ...pkg,
      trip_type: 'package'
    }));
    bookings.push(...normalizedPackageBookings);

    if (currentBooking) {
      bookings.unshift({
        ...currentBooking,
        trip_type: 'single'
      });
    }

    // Sort by date (most recent first)
    return bookings.sort((a, b) => {
      const dateA = new Date(a.created_at || a.date_of_travel);
      const dateB = new Date(b.created_at || b.date_of_travel);
      return dateB.getTime() - dateA.getTime();
    });
  }, [confirmedBookings, currentBooking, packageBookings]);

  const filteredBookings = useMemo(() => {
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed && !booking.is_closed);

    switch (viewMode) {
      case 'current':
        return activeBookings.filter(booking =>
          booking.status === 'Started' && !booking.is_ride_closed && !booking.is_closed
        );
      case 'accepted':
        return activeBookings.filter(booking =>
          (booking.is_confirmed === 'true' || booking.is_confirmed === true) &&
          !booking.is_ride_closed && !booking.is_closed && booking.status !== 'Started'
        );
      case 'pending':
        return activeBookings.filter(booking =>
          (booking.is_confirmed === 'false' || booking.is_confirmed === false) &&
          !booking.is_ride_closed && !booking.is_closed
        );
      default:
        return activeBookings;
    }
  }, [allBookings, viewMode]);

  const getToggleCount = (mode: string) => {
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed && !booking.is_closed);

    switch (mode) {
      case 'current':
        return activeBookings.filter(booking => booking.status === 'Started').length;
      case 'accepted':
        return activeBookings.filter(booking =>
          booking.is_confirmed === 'true' || booking.is_confirmed === true && booking.status !== 'Started'
        ).length;
      case 'pending':
        return activeBookings.filter(booking =>
          booking.is_confirmed === 'false' || booking.is_confirmed === false
        ).length;
      default:
        return 0;
    }
  };

  const renderPackageBookingCard = (booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(booking.is_ride_closed || booking.is_closed, booking.is_confirmed, booking.status) }
          ]} />

          <Text style={[styles.statusText, { color: getStatusColor(booking.is_ride_closed || booking.is_closed, booking.is_confirmed, booking.status) }]}>
            {getStatusText(booking.is_ride_closed || booking.is_closed, booking.is_confirmed, booking.status)} PACKAGE
          </Text>

        </View>
        <Text style={styles.bookingDate}>
          {new Date(booking.date_of_travel).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
          <Text style={styles.routeText}>{booking.pick_up_place}</Text>
        </View>
      </View>

      <View style={styles.packageDetails}>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>{booking.vehicle_type}</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="road-variant" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>
            {booking.total_km_booked} km
          </Text>
        </View>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>
            {booking.total_hours_booked} hrs
          </Text>
        </View>
        <View style={styles.orderDetailItem}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#6B7280" />
          <Text style={styles.orderDetailText}>
            {booking.no_of_nights} night(s)
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {new Date(booking.date_of_travel).toLocaleDateString()}
          </Text>
        </View>
        {booking.pickup_time !== '' && (
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{booking.pickup_time}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailText}>₹{booking.total_amount || "0"}</Text>
        </View>
      </View>


        {(booking.is_confirmed === 'true' || booking.is_confirmed === true) && (
  <View style={styles.confirmedDriverContainer}>
    <View style={styles.driverInfoRow}>
      {/* Driver Info Section (85%) */}
      <View style={styles.driverInfoSection}>
        <LinearGradient
          colors={['#059669', '#10B981', '#34D399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.driverInfoGradient}
        >
          <View style={styles.driverInfoContent}>
            <View style={styles.driverIcon}>
              <User size={20} color="#FFFFFF" />
            </View>
            <View style={styles.driverTextContainer}>
              <Text style={styles.driverLabel}>Driver Assigned</Text>
              <Text style={styles.driverName}>
                {String(booking?.confirmed_driver_full_name || 'N/A')}
              </Text>
              <View style={styles.carInfoRow}>
                <Car size={14} color="#D1FAE5" />
                <Text style={styles.carNumber}>
                  {String(booking?.confirmed_driver_rcnumber || 'N/A')}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Gap (2%) */}
      <View style={styles.gap} />

      {/* Call Button Section (13%) */}
      <TouchableOpacity
        style={styles.callButtonSection}
        onPress={handleDriverCall}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1E40AF', '#3B82F6', '#60A5FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.callButtonGradient}
        >
          <Phone size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
)}



      {booking.special_instructions !== '' && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Special Instructions:</Text>
          <Text style={styles.instructionsText}>
            {booking.special_instructions}
          </Text>
        </View>
      )}

      <View style={styles.paymentInfo}>
        <View style={styles.paymentItem}>
          <Text style={styles.paymentLabel}>Amount Paid:</Text>
          <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
            ₹{booking.advanced_payment || 0}
          </Text>
        </View>
        {(booking.pending_payment || booking.total_amount) > 0 && (
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Amount Pending:</Text>
            <Text style={[styles.paymentAmount, { color: '#EF4444' }]}>
              ₹{booking.pending_payment || 0}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.packageCostDetails}>
        {booking.base_amount !== "" && booking.base_amount > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="cash" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Base: ₹{booking.base_amount}
            </Text>
          </View>
        )}
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="cash" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              GST: ₹100
            </Text>
          </View>
        {booking.toll_amount !== "" && booking.toll_amount > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Toll: ₹{booking.toll_amount}
            </Text>
          </View>
        )}
        {booking.parking_fee !== "" && booking.parking_fee > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="parking" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Parking: ₹{booking.parking_fee}
            </Text>
          </View>
        )}
        {booking.night_halt_charges !== "" && booking.night_halt_charges > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Night Halt: ₹{booking.night_halt_charges}
            </Text>
          </View>
        )}
        {booking.total_amount_for_extra_km !== "" && booking.total_amount_for_extra_km > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Extra KM Charges: ₹{booking.total_amount_for_extra_km}
            </Text>
          </View>
        )}
         {booking.total_amount_for_extra_hr !== "" && booking.total_amount_for_extra_hr > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Extra HR Charges: ₹{booking.total_amount_for_extra_hr} 
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        {booking.is_closed !== "" && booking.is_closed === true && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Package Completed</Text>
          </TouchableOpacity>
        )}

        {booking.status === "Started" && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="car" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Trip Started</Text>
          </TouchableOpacity>
        )}

        {booking.is_closed !== "" || booking.is_closed === false && booking.is_confirmed && (
          <TouchableOpacity style={styles.primaryAction}>
            <MaterialCommunityIcons name="car" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>Driver Confirmed</Text>
          </TouchableOpacity>
        )}

        {booking.is_closed !== "" || booking.is_closed === false && !booking.is_confirmed && (
          <TouchableOpacity style={styles.secondaryAction}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
            <Text style={styles.secondaryActionText}>Waiting for Driver</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBookingCard = (booking: Booking) => {
    // If it's a package booking, use the package card layout
    // console.log("Rendering booking card for:", booking);
    if (booking.trip_type === 'package') {
      return renderPackageBookingCard(booking);
    }

    // Regular booking card for single/round trips
    return (
      <View key={String(booking.id)} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingStatus}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: getStatusColor(
                    booking.is_closed || booking.is_ride_closed,
                    booking.is_confirmed,
                    booking.status
                  ),
                },
              ]}
            />
            <Text style={[styles.statusText, {
              color: getStatusColor(
                booking.is_ride_closed || booking.is_closed,
                booking.is_confirmed,
                booking.status
              )
            }]}>
              {getStatusText(
                booking.is_ride_closed || booking.is_closed,
                booking.is_confirmed,
                booking.status
              )}
              {booking.round_trip === true || booking.round_trip === 'true' ? ' ROUND TRIP' : ''}
            </Text>


          </View>
          <Text style={styles.bookingDate}>
            {String(new Date(booking.date_of_travel).toLocaleDateString())}
          </Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
            <Text style={styles.routeText}>
              {String(booking.start_point || '')}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
            <Text style={styles.routeText}>
              {String(booking.end_point || '')}
            </Text>
          </View>
          {booking.round_trip && (
            <>
              <View style={styles.routeLine} />
              <View style={styles.routeItem}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={16}
                  color="#10B981"
                />
                <Text style={styles.routeText}>
                  {String(booking.start_point || '')}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {String(booking.vehicle_type || '')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>
              ₹{String(booking.total_amount || 0)}
            </Text>
          </View>
          {booking.pickup_time !== "" && (
            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.detailText}>
                {String(booking.pickup_time || '')}
              </Text>
            </View>
          )}
        </View>

        {/* Show driver info for current trips or accepted trips */}
{(booking.is_confirmed === 'true' || booking.is_confirmed === true) && (
  <View style={styles.confirmedDriverContainer}>
    <View style={styles.driverInfoRow}>
      {/* Driver Info Section (85%) */}
      <View style={styles.driverInfoSection}>
        <LinearGradient
          colors={['#059669', '#10B981', '#34D399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.driverInfoGradient}
        >
          <View style={styles.driverInfoContent}>
            <View style={styles.driverIcon}>
              <User size={20} color="#FFFFFF" />
            </View>
            <View style={styles.driverTextContainer}>
              <Text style={styles.driverLabel}>Driver Assigned</Text>
              <Text style={styles.driverName}>
                {String(booking?.confirmed_driver_name || 'N/A')}
              </Text>
              <View style={styles.carInfoRow}>
                <Car size={14} color="#D1FAE5" />
                <Text style={styles.carNumber}>
                  {String(booking?.confirmed_rc_number || 'N/A')}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Gap (2%) */}
      <View style={styles.gap} />

      {/* Call Button Section (13%) */}
      <TouchableOpacity
        style={styles.callButtonSection}
        onPress={handleDriverCall}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1E40AF', '#3B82F6', '#60A5FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.callButtonGradient}
        >
          <Phone size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
)}

        {(booking.ride_instructions !== "" || booking.pickupInstructions !== "") && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Pickup Instructions:</Text>
            <Text style={styles.instructionsText}>
              {String(booking.ride_instructions || booking.pickupInstructions)}
            </Text>
          </View>
        )}

        <View style={styles.paymentInfo}>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Amount Paid:</Text>
            <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
              ₹{String(booking.advanced_payment || 0)}
            </Text>
          </View>
          {booking.pending_payment > 0 && (
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Amount Pending:</Text>
              <Text style={[styles.paymentAmount, { color: '#EF4444' }]}>
                ₹{String(booking.pending_payment || 0)}
              </Text>
            </View>
          )}
        </View>

           <View style={styles.packageCostDetails}>
        {booking.base_fare !== "" && booking.base_fare > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="cash" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Base: ₹{booking.base_fare}
            </Text>
          </View>
        )}
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="cash" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              GST: ₹100
            </Text>
          </View>
        {booking.toll_charges.total !== "" && booking.toll_charges.total > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Toll: ₹{booking.toll_charges.total}
            </Text>
          </View>
        )}
        {booking.parking_fee !== "" && booking.parking_fee > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="parking" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Parking: ₹{booking.parking_fee}
            </Text>
          </View>
        )}
        {booking.night_halt_charges !== "" && booking.night_halt_charges > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Night Halt: ₹{booking.night_halt_charges}
            </Text>
          </View>
        )}
       
         {booking.waiting_charges !== "" && booking.waiting_charges > 0 && (
          <View style={styles.orderDetailItem}>
            <MaterialCommunityIcons name="weather-night" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              Waiting Charges: ₹{booking.waiting_charges}
            </Text>
          </View>
        )}
      </View>

        <View style={styles.bookingActions}>
          {booking.status === 'Started' && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => router.push('/tracking')}
            >
              <Text style={styles.trackButtonText}>Trip Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };




  const getStatusColor = (confirmed: any, status?: string) => {
    if (status === 'started') return '#3B82F6';
    if (confirmed === 'true' || confirmed === true) return '#10B981';
    if (confirmed === 'false' || confirmed === false) return '#F59E0B';
    return '#6B7280';
  };

  const getStatusText = (closed: any, confirmed: any, status?: string) => {
    if (closed) return 'COMPLETED';
    if (status === 'Started') return 'CURRENT TRIP';
    if (confirmed === 'true' || confirmed === true) return 'CONFIRMED';
    if (confirmed === 'false' || confirmed === false || confirmed === "") return 'PENDING';
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

  if (isLoading) {
    return (
      <TaxiLoading 
        visible={true} 
        loadingText="Loading your bookings..." 
      />
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
              {viewMode === 'current' ? "No Current Trips" : null}
              {viewMode === 'accepted' ? "No Driver Accepted Trips" : null}
              {viewMode === 'pending' ? "No Pending Trips" : null}
            </Text>
            <Text style={styles.emptyStateText}>
              {viewMode === 'current' ? "You don't have any ongoing rides" : null}
              {viewMode === 'accepted' ? "No confirmed rides by drivers yet" : null}
              {viewMode === 'pending' ? "No trips waiting for driver acceptance" : null}
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
// Add these missing styles to your existing styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  latestOrderCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  noOrderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  refreshButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  refreshIcon: {
    opacity: 0.5,
  },
  orderRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routePointText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  routeConnector: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  routeDots: {
    flexDirection: 'row',
    marginBottom: 2,
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
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  packageDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  packageCostDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  instructions: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#111827',
  },
  inactiveToggleText: {
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  bookingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    textTransform: 'uppercase',
  },
  bookingDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 7,
    marginBottom: 4,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  driverInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  driverDetails: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
    color: '#059669',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentItem: {
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  trackButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 100,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmedDriverContainer: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
  },
  driverInfoSection: {
    flex: 0.85, // 85% width
    height: '100%',
  },
  driverInfoGradient: {
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  driverInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF20',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  driverLabel: {
    fontSize: 10,
    color: '#D1FAE5',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  carInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carNumber: {
    fontSize: 12,
    color: '#D1FAE5',
    marginLeft: 4,
    fontWeight: '500',
  },
  gap: {
    flex: 0.02, // 2% gap
  },
  callButtonSection: {
    flex: 0.13, // 13% width
    height: '100%',
  },
  callButtonGradient: {
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  }
});