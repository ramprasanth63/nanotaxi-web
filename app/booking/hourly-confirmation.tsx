import AuthPopup from '@/components/AuthPopup';
import LocationInputModal from '@/components/LocationInputModal';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';
import { Location as LocationType } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

interface HourlyPackage {
  id: number;
  vehicle_model: string;
  package_hours: number;
  package_km: number;
  rate_per_hour: string;
  package_price: string;
  rate_per_km: string;
  extra_km_rate: string;
  extra_hr_rate: string;
  capacity: number;
  image?: string;
  is_active: boolean;
  name: string;
}

export default function HourlyConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoggedIn, user } = useAuth();
  const isMounted = useRef(true);

  // Package and pricing states
  const [selectedHours, setSelectedHours] = useState(0);
  const [calculatedKm, setCalculatedKm] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Location and form states
  const [pickupPlace, setPickupPlace] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationType[]>([]);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<LocationType | null>(null);
  const [editingPickup, setEditingPickup] = useState(false);
  
  // Date and time states
  const [dateOfTravel, setDateOfTravel] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Other form states
  const [pickupAddress, setPickupAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // UI states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [guestCustomerId, setGuestCustomerId] = useState<string>('');

  // API Keys
  const GOOGLE_MAPS_API_KEY = "AIzaSyCy9vw9wy_eZeYd4BO9ifFiky2vOfvB-zc";
  const OPENROUTESERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3MDRkYTQ3MWYxNDRiMTdiODBiMGViNzQwZTZiY2NjIiwiaCI6Im11cm11cjY0In0=";

  const selectedPackage: HourlyPackage = JSON.parse(params.package as string);

  useEffect(() => {
    isMounted.current = true;
    
    if (selectedPackage) {
      setSelectedHours(selectedPackage.package_hours);
      calculatePricing(selectedPackage.package_hours);
    }

    return () => {
      isMounted.current = false;
    };
  }, [selectedPackage]);

  useEffect(() => {
    if (pickupPlace.length > 2 && editingPickup) {
      searchLocationsByGoogle(pickupPlace);
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupPlace, editingPickup]);

  const searchLocationsByGoogle = async (query: string) => {
    if (!isMounted.current) return;

    setSearchLoading(true);
    try {
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&components=country:IN&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(autocompleteUrl);
      const data = await res.json();

      const predictions = data.predictions || [];

      if (!predictions.length) {
        console.warn("Google returned no results, falling back to ORS...");
        await searchLocations(query);
        return;
      }

      const locations: LocationType[] = await Promise.all(
        predictions.map(async (prediction: any, i: number) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,name,formatted_address,place_id&key=${GOOGLE_MAPS_API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            const location = detailsData.result;

            return {
              id: location.place_id || String(i),
              name: location.name || prediction.description || "Unknown",
              address: location.formatted_address || prediction.description || "",
              latitude: location.geometry?.location?.lat || 0,
              longitude: location.geometry?.location?.lng || 0,
              raw: location,
            };
          } catch (err) {
            console.error("Place details fetch failed, skipping:", err);
            return null;
          }
        })
      );

      const validLocations = locations.filter((loc) => loc !== null);

      if (!validLocations.length) {
        console.warn("Google details fetch failed, falling back to ORS...");
        await searchLocations(query);
        return;
      }

      if (isMounted.current) {
        setPickupSuggestions(validLocations as LocationType[]);
      }
    } catch (error) {
      console.error("Google Places search error:", error);
      if (isMounted.current) {
        await searchLocations(query);
      }
    } finally {
      if (isMounted.current) {
        setSearchLoading(false);
      }
    }
  };

  const searchLocations = async (query: string) => {
    if (!isMounted.current) return;

    setSearchLoading(true);
    try {
      const url = `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=IND`;
      const res = await fetch(url);
      const data = await res.json();

      const features = data.features || [];
      const locations: LocationType[] = features.map((feature: any, i: number) => ({
        id: feature.properties.id || String(i),
        name: feature.properties.label || feature.properties.name || "Unknown",
        address: feature.properties.label || "",
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        raw: feature,
      }));

      if (isMounted.current) {
        setPickupSuggestions(locations);
      }
    } catch (error) {
      console.error('Location search error:', error);
      if (isMounted.current) {
        setPickupSuggestions([]);
      }
    } finally {
      if (isMounted.current) {
        setSearchLoading(false);
      }
    }
  };

  const handleOpenPickupModal = () => {
    setShowPickupModal(true);
    setEditingPickup(true);
  };

  const handleClosePickupModal = () => {
    setShowPickupModal(false);
    setEditingPickup(false);
    setPickupSuggestions([]);
  };

  const selectPickupLocation = (location: LocationType) => {
    setSelectedPickupLocation(location);
    setPickupPlace(location.name);
    setPickupSuggestions([]);
    setEditingPickup(false);
    setShowPickupModal(false);
  };

  const calculatePricing = (hours: number) => {
    if (!selectedPackage) return;

    const baseHours = selectedPackage.package_hours;
    const baseKm = selectedPackage.package_km;
    const basePrice = parseFloat(selectedPackage.package_price);
    const extraHrRate = parseFloat(selectedPackage.extra_hr_rate);
    const kmPerHour = baseKm / baseHours;

    let totalHours = hours;
    let totalKm = Math.round(kmPerHour * totalHours);
    let price = basePrice;

    if (totalHours > baseHours) {
      const extraHours = totalHours - baseHours;
      price += extraHours * extraHrRate;
    }

    setCalculatedKm(totalKm);
    setTotalPrice(price);
  };

  const adjustHours = (increment: boolean) => {
    if (!selectedPackage) return;

    let newHours;
    if (increment) {
      newHours = selectedHours + 1;
    } else {
      newHours = Math.max(selectedPackage.package_hours, selectedHours - 1);
    }
    
    setSelectedHours(newHours);
    calculatePricing(newHours);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfTravel(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setPickupTime(selectedTime);
    }
  };

  const handleBookPackage = async (customerId?: string) => {
    // Validation
    if (!selectedPickupLocation) {
      Alert.alert('Error', 'Please select pickup location');
      return;
    }

    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }

    const customerIdToUse = customerId || guestCustomerId || user?.customer_id;
    
    if (!customerIdToUse) {
      setShowAuthPopup(true);
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        customer_id: customerIdToUse,
        vehicle_type: selectedPackage.vehicle_model,
        total_hours_booked: selectedHours,
        total_km_booked: calculatedKm,
        toll_amount: 0,
        parking_fee: 0,
        no_of_nights: 1,
        night_halt_charges: 0,
        base_amount: totalPrice,
        total_amount: totalPrice,
        date_of_travel: dateOfTravel.toISOString().split('T')[0],
        pickup_time: pickupTime.toTimeString().split(' ')[0],
        pick_up_place: selectedPickupLocation.name,
        pick_up_address: pickupAddress.trim(),
        special_instructions: specialInstructions.trim()
      };

      const response = await apiPost('/api/book_package/', payload);

      if (response.status === 201) {
        // Alert.alert('Success', 'Package booked successfully!', [
        //   {
        //     text: 'OK',
        //     onPress: () => router.push('/tracking')
        //   }
        // ]);
        router.push('/tracking');
      } else {
        Alert.alert('Error', 'Failed to book package. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to book package. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAuthSuccess = (customerId: string) => {
    setGuestCustomerId(customerId);
    setShowAuthPopup(false);
    // Automatically proceed with booking after successful auth
    // setTimeout(() => {
    //   handleBookPackage(customerId);
    // }, 500);
  };

  const handleGuestContinue = () => {
    setShowAuthPopup(false);
    // Guest flow is handled within the AuthPopup component
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
          <Text style={styles.headerTitle}>Confirm Package</Text>
          <Text style={styles.headerSubtitle}>Review your hourly package</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>{selectedPackage.vehicle_model}</Text>
            <Text style={styles.packageCapacity}>Capacity: {selectedPackage.capacity} seats</Text>
            <Text style={styles.packageInfo}>
              Base: {selectedPackage.package_hours} Hours • {selectedPackage.package_km} KM
            </Text>
            <View style={styles.packageRates}>
              <Text style={styles.rateText}>Extra KM: ₹{selectedPackage.extra_km_rate}/km</Text>
              <Text style={styles.rateText}>Extra Hour: ₹{selectedPackage.extra_hr_rate}/hr</Text>
            </View>
            <Text style={styles.packagePrice}>Base Price: ₹{selectedPackage.package_price}</Text>
          </View>
        </View>

        {/* Hour Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Hours</Text>
          <View style={styles.hourSelectionContainer}>
            <View style={styles.hourAdjuster}>
              <TouchableOpacity
                style={styles.hourButton}
                onPress={() => adjustHours(false)}
              >
                <MaterialCommunityIcons name="minus" size={24} color="#10B981" />
              </TouchableOpacity>
              <Text style={styles.hourText}>{selectedHours} Hours</Text>
              <TouchableOpacity
                style={styles.hourButton}
                onPress={() => adjustHours(true)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#10B981" />
              </TouchableOpacity>
            </View>
            <Text style={styles.calculatedKmText}>Total KM: {calculatedKm} km</Text>
            <Text style={styles.totalPriceText}>Total Price: ₹{totalPrice}</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          {/* Pickup Location */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={handleOpenPickupModal}
          >
            <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" style={styles.inputIcon} />
            <Text style={[styles.inputText, { color: pickupPlace ? '#1F2937' : '#9CA3AF' }]}>
              {pickupPlace || 'Select pickup location'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#D1D5DB" />
          </TouchableOpacity>

          {/* Date and Time Selection */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.inputContainer, styles.dateTimeInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#10B981" style={styles.inputIcon} />
              <Text style={styles.dateTimeText}>
                {dateOfTravel.toDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputContainer, styles.dateTimeInput]}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialCommunityIcons name="clock" size={20} color="#10B981" style={styles.inputIcon} />
              <Text style={styles.dateTimeText}>
                {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pickup Address */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="home" size={20} color="#10B981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Enter detailed pickup address"
              multiline
            />
          </View>

          {/* Special Instructions */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="note-text" size={20} color="#10B981" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Special instructions (optional)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Total Fare */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Fare</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>₹{totalPrice}</Text>
            <Text style={styles.fareNote}>
              Price is inclusive of GST and exclusive of toll.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedPickupLocation || !pickupAddress.trim() || bookingLoading) && styles.disabledButton
          ]}
          onPress={() => handleBookPackage()}
          disabled={!selectedPickupLocation || !pickupAddress.trim() || bookingLoading}
        >
          {bookingLoading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.bookButtonText}>Booking...</Text>
            </>
          ) : (
            <>
              <Text style={styles.bookButtonText}>Book Package - ₹{totalPrice}</Text>
              <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfTravel}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickupTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Location Input Modal */}
      <LocationInputModal
        visible={showPickupModal}
        onClose={handleClosePickupModal}
        onSelectLocation={selectPickupLocation}
        onSearchChange={setPickupPlace}
        title="Select Pickup Location"
        placeholder="Search for pickup location..."
        initialValue={pickupPlace}
        suggestions={pickupSuggestions}
        loading={searchLoading}
        iconName="map-marker"
        iconColor="#10B981"
      />

      {/* Auth Popup */}
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
  packageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  packageCapacity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  packageInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  packageRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  hourSelectionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  hourAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  hourButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  hourText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 24,
  },
  calculatedKmText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalPriceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  fareContainer: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  fareNote: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});