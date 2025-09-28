import AuthPopup from '@/components/AuthPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Location, Vehicle } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createBooking } = useBooking();
  const { isLoggedIn, user } = useAuth();
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [guestCustomerId, setGuestCustomerId] = useState<string>('');

  // Add this helper function at the top of your component
  const safeParseJSON = (param: any) => {
    if (typeof param === 'string') {
      try {
        return JSON.parse(param);
      } catch (error) {
        console.error('JSON parse error:', error);
        return null;
      }
    }
    return param; // Already an object
  };

  // Replace your existing parameter parsing with:
  const startLocation: Location = safeParseJSON(params.startLocation);
  const endLocation: Location = safeParseJSON(params.endLocation);
  const vehicle: Vehicle = safeParseJSON(params.vehicle);
  const fare = typeof params.fare === 'string' ? parseInt(params.fare) : params.fare;
  // pickupOption, date, time
  const pickupOption = params.pickupOption as 'now' | 'schedule';
  const pickupDate = pickupOption === 'schedule' && params.pickupDate ? 
    (typeof params.pickupDate === 'string' ? new Date(params.pickupDate) : params.pickupDate) : null;
  const pickupTime = pickupOption === 'schedule' && params.pickupTime ? 
    (typeof params.pickupTime === 'string' ? new Date(params.pickupTime) : params.pickupTime) : null;
  const roundTrip = params.roundTrip === 'true' || params.roundTrip === true;

  const handleConfirmBooking = async (customerId?: string) => {
    const customerIdToUse = customerId || guestCustomerId || user?.customer_id;
    
    if (!isLoggedIn) {
      setShowAuthPopup(true);
      return;
    }

    setLoading(true);
    try {
      // Prepare API payload
      const now = new Date();
      const travelDate =
        pickupOption === 'now'
          ? now.toISOString().slice(0, 10)
          : pickupDate?.toISOString().slice(0, 10);
      const travelTime =
        pickupOption === 'now'
          ? now.toTimeString().slice(0, 5)
          : pickupTime
          ? pickupTime.toTimeString().slice(0, 5)
          : '';

      // const payload = {
      //   customer_id: user.customer_id,
      //   start_point: startLocation.name,
      //   end_point: endLocation.name,
      //   vehicle_type: vehicle.type,
      //   total_amount: fare.toString(),
      //   date_of_travel: travelDate,
      //   pickup_time: travelTime,
      // };
      // // console.log("Booking payload:", payload);
      // const response = await apiPost('/api/book_ride/', payload);
      // // console.log("Booking response:", response.data);
      const success = await createBooking(
        user,
        startLocation,
        endLocation,
        vehicle,
        fare,
        pickupInstructions || undefined,
        pickupOption || undefined,
        pickupDate || undefined,
        pickupTime || undefined,
        roundTrip
      );
      if (success) {
        router.replace('/tracking')
      } else {
        Alert.alert('Error', 'Failed to book ride. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (customerId: string) => {
    setGuestCustomerId(customerId);
    setShowAuthPopup(false);
    // Automatically proceed with booking after successful auth
    // setTimeout(() => {
    //   handleConfirmBooking(customerId);
    // }, 1000);
  };

  const handleGuestContinue = () => {
    setShowAuthPopup(false);
  };

  const handleGuestBooking = () => {
    router.push({
      pathname: '/booking/guest',
      params: {
        startLocation: JSON.stringify(startLocation),
        endLocation: JSON.stringify(endLocation),
        vehicle: JSON.stringify(vehicle),
        fare: fare.toString(),
        pickupInstructions,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <Text style={styles.headerSubtitle}>Review your trip details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.routeContainer}>
            {!roundTrip ? (
              // One-way trip UI
              <>
                <View style={styles.routeItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" />
                  <View style={styles.routeText}>
                    <Text style={styles.locationName}>{startLocation?.name}</Text>
                    <Text style={styles.locationAddress}>{startLocation?.address}</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#EF4444" />
                  <View style={styles.routeText}>
                    <Text style={styles.locationName}>{endLocation?.name}</Text>
                    <Text style={styles.locationAddress}>{endLocation?.address}</Text>
                  </View>
                </View>
              </>
            ) : (
              // Round trip UI (From → To → From)
              <>
                <View style={styles.routeItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" />
                  <View style={styles.routeText}>
                    <Text style={styles.locationName}>{startLocation?.name}</Text>
                    <Text style={styles.locationAddress}>{startLocation?.address}</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#EF4444" />
                  <View style={styles.routeText}>
                    <Text style={styles.locationName}>{endLocation?.name}</Text>
                    <Text style={styles.locationAddress}>{endLocation?.address}</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" />
                  <View style={styles.routeText}>
                    <Text style={styles.locationName}>{startLocation?.name}</Text>
                    <Text style={styles.locationAddress}>Return destination</Text>
                  </View>
                </View>
              </>
            )}
          </View>


        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.vehicleContainer}>
            <MaterialCommunityIcons name="car" size={20} color="#6B7280" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle?.type}</Text>
              <Text style={styles.vehicleType}>{vehicle?.capacity} seats</Text>
            </View>
            <Text style={styles.vehiclePrice}>₹{vehicle?.pricePerKm}/km</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Details</Text>
          <View style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 16,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <MaterialCommunityIcons name={pickupOption === 'now' ? 'clock-outline' : 'calendar-clock'} size={32} color={pickupOption === 'now' ? '#10B981' : '#3B82F6'} style={{ marginRight: 18 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>
                {pickupOption === 'now' ? 'Pickup Now' : 'Scheduled Pickup'}
              </Text>
              {pickupOption === 'now' ? (
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Your driver will arrive as soon as possible.</Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: '#374151', marginRight: 16 }}>
                    {pickupDate?.toLocaleDateString()}
                  </Text>
                  <MaterialCommunityIcons name="clock" size={18} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: '#374151' }}>
                    {pickupTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
            </View>
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <View style={styles.fareContainer}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>₹0</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance Charges</Text>
              <Text style={styles.fareValue}>₹{Math.max(0, Math.round((fare - 300 - 400) || 0))}</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Driver Fee</Text>
              <Text style={styles.fareValue}>₹300</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Toll (est.)</Text>
              <Text style={styles.fareValue}>₹{fare > 10 ? 400 : 0}</Text>
            </View>
            <View style={[styles.fareItem, styles.totalFare]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{fare}</Text>
            </View>
          </View>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Instructions</Text>
          <View style={styles.instructionsContainer}>
            <MaterialCommunityIcons name="message-text" size={20} color="#6B7280" style={styles.instructionsIcon} />
            <TextInput
              style={styles.instructionsInput}
              placeholder="Add pickup instructions (optional)"
              placeholderTextColor="#9CA3AF"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.instructionsHint}>
            e.g., "Near the main gate", "Blue building", etc.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Fare</Text>
          <View
            style={{
              backgroundColor: '#ECFDF5',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              marginTop: 12,
              marginBottom: 8,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#10B981', marginTop: 8 }}>
              ₹{fare}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
              Price is inclusive of GST and exclusive of toll.
            </Text>
          </View>
        </View>

        {/* <View style={styles.estimatedTime}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#10B981" />
          <Text style={styles.estimatedTimeText}>Estimated pickup: 2-5 minutes</Text>
        </View> */}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirmBooking()}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.confirmButtonText}>Booking...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#ffffff" />
              <Text style={styles.confirmButtonText}>Confirm Ride - ₹{fare}</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* {!isLoggedIn && (
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestBooking}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        )} */}
      </View>

      <AuthPopup
        visible={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onLoginSuccess={handleAuthSuccess}
        onGuestContinue={handleGuestContinue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  routeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginLeft: 10,
    marginVertical: 8,
  },
  routeText: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  fareContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalFare: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  instructionsIcon: {
    marginTop: 2,
  },
  instructionsInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  instructionsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  estimatedTimeText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  guestButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  pickupContainer: {
    marginTop: 12,
  },
  pickupLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickupValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  scheduleContainer: {
    marginTop: 12,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});