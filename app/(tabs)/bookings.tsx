import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
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

export default function BookingsScreen() {
  const router = useRouter();
  const { confirmedBookings, fetchConfirmedBookings, updatePickupInstructions, currentBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('current'); // 'current', 'accepted', 'pending'
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [instructionsText, setInstructionsText] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchConfirmedBookings();
    }
  }, [isLoggedIn]);

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

  const allBookings = useMemo(() => {
    const bookings = [...confirmedBookings];
    console.log("Current confirmed bookings:", bookings);
    if (currentBooking) {
      bookings.unshift(currentBooking);
    }
    return bookings;
  }, [confirmedBookings, currentBooking]);

  // Filter bookings based on conditions and exclude closed rides
  const filteredBookings = useMemo(() => {
    // Filter out closed rides first
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed);
    
    switch (viewMode) {
      case 'current':
        return activeBookings.filter(booking => booking.status === 'started' && !booking.is_ride_closed);
      case 'accepted':
        return activeBookings.filter(booking => booking.is_confirmed === 'true' || booking.is_confirmed === true  && !booking.is_ride_closed);
      case 'pending':
        return activeBookings.filter(booking => booking.is_confirmed === 'false' || booking.is_confirmed === false  && !booking.is_ride_closed);
      default:
        return activeBookings;
    }
  }, [allBookings, viewMode]);

  const getToggleCount = (mode: string) => {
    const activeBookings = allBookings.filter(booking => !booking.is_ride_closed);
    
    switch (mode) {
      case 'current':
        return activeBookings.filter(booking => booking.status === 'started').length;
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditInstructions(booking)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Edit Instructions</Text>
        </TouchableOpacity>
        
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

      {/* Toggle Buttons */}
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

      {/* Instructions Modal */}
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
});