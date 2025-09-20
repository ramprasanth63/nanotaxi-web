import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Booking } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function HistoryScreen() {
  const router = useRouter();
  const { bookingHistory, fetchBookingHistory, rateBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  let isMounted = true;
  if (isLoggedIn) {
    setLoading(true);
    fetchBookingHistory().finally(() => {
      if (isMounted) setLoading(false);
    });
  } else {
    setLoading(false);
  }
  return () => { isMounted = false; };
}, [isLoggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingHistory();
    setRefreshing(false);
  };

  const handleRateRide = (booking: Booking) => {
    Alert.alert(
      'Rate this ride',
      `How was your experience with ${booking.driver?.name || 'your driver'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '⭐⭐⭐⭐⭐ (5 Stars)', onPress: () => submitRating(booking.id, 5) },
        { text: '⭐⭐⭐⭐ (4 Stars)', onPress: () => submitRating(booking.id, 4) },
        { text: '⭐⭐⭐ (3 Stars)', onPress: () => submitRating(booking.id, 3) },
        { text: '⭐⭐ (2 Stars)', onPress: () => submitRating(booking.id, 2) },
        { text: '⭐ (1 Star)', onPress: () => submitRating(booking.id, 1) },
      ]
    );
  };

  const submitRating = async (bookingId: string, rating: number) => {
    try {
      await rateBooking(bookingId, rating, `${rating} star rating`);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const renderHistoryCard = (booking: Booking) => (
    <View key={booking.id} style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {new Date(booking.date_of_travel).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) }
        ]}>
          <Text style={styles.statusText}>{booking.status === 'Started' ? 'Completed' : booking.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.start_point}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.end_point}
          </Text>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.vehicle_type}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
          <Text style={styles.detailText}>₹{booking.total_amount}</Text>
        </View>
      </View>

      {booking.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>Driver: {booking.driver.name}</Text>
          <Text style={styles.driverDetails}>
            {booking.driver.carNumber} • ⭐ {booking.driver.rating}
          </Text>
        </View>
      )}

      {booking.rating ? (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Your Rating:</Text>
          <View style={styles.starsDisplay}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= booking.rating! ? 'star' : 'star-outline'}
                size={16}
                color={star <= booking.rating! ? '#FFD700' : '#E5E7EB'}
              />
            ))}
          </View>
        </View>
      ) : (
        booking.status === 'completed' && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateRide(booking)}
          >
            <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.rateButtonText}>Rate this ride</Text>
          </TouchableOpacity>
        )
      )}

      {booking.feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Your Feedback:</Text>
          <Text style={styles.feedbackText}>"{booking.feedback}"</Text>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Started': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const displayHistory = bookingHistory.length > 0 ? bookingHistory : [];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Login Required</Text>
          <Text style={styles.emptyStateText}>
            Please login to view your ride history
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
  if (loading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>Your past trips and experiences</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Ride History</Text>
            <Text style={styles.emptyStateText}>
              You haven't taken any rides yet
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/booking/location')}
            >
              <Text style={styles.bookButtonText}>Book Your First Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayHistory.map(renderHistoryCard)
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
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
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  driverInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  driverDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#92400E',
    marginRight: 8,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 2,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  rateButtonText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 6,
  },
  feedbackContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontStyle: 'italic',
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
});