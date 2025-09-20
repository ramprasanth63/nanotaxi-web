import { apiGet, apiPost } from '@/services/apiClient';
import { Location as LocationType } from '@/types';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import { apiGet, apiPost } from '@/utils/api';
// import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

declare module 'react-native-vector-icons/MaterialCommunityIcons';

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

export default function LocationScreen() {
  const router = useRouter();
  const isMounted = useRef(true);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [roundTrip, setRoundTrip] = useState<boolean>(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [startLocationQuery, setStartLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationType[]>([]);
  const [startLocationSuggestions, setStartLocationSuggestions] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingStartLocation, setEditingStartLocation] = useState(false);
  const [editingDestination, setEditingDestination] = useState(false);
  
  // Hourly Package States
  const [bookingMode, setBookingMode] = useState<'trip' | 'hourly'>('trip');
  const [hourlyPackages, setHourlyPackages] = useState<HourlyPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<HourlyPackage | null>(null);
  const [selectedHours, setSelectedHours] = useState(0);
  const [calculatedKm, setCalculatedKm] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [packagesLoading, setPackagesLoading] = useState(false);
  
  // Booking Form States
  const [pickupPlace, setPickupPlace] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationType[]>([]);
  const [editingPickup, setEditingPickup] = useState(false);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<LocationType | null>(null);
  const [dateOfTravel, setDateOfTravel] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [pickupAddress, setPickupAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const OPENROUTESERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3MDRkYTQ3MWYxNDRiMTdiODBiMGViNzQwZTZiY2NjIiwiaCI6Im11cm11cjY0In0=";
  const GOOGLE_MAPS_API_KEY = "AIzaSyCy9vw9wy_eZeYd4BO9ifFiky2vOfvB-zc";

  useEffect(() => {
    isMounted.current = true;
    getCurrentLocation();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (bookingMode === 'hourly') {
      fetchHourlyPackages();
    }
  }, [bookingMode]);

  useEffect(() => {
    if (destinationQuery.length > 2 && editingDestination) {
      searchLocationsByGoogle(destinationQuery, 'destination');
    } else {
      setLocationSuggestions([]);
    }
  }, [destinationQuery, editingDestination]);

  useEffect(() => {
    if (startLocationQuery.length > 2 && editingStartLocation) {
      searchLocationsByGoogle(startLocationQuery, 'start');
    } else {
      setStartLocationSuggestions([]);
    }
  }, [startLocationQuery, editingStartLocation]);

  useEffect(() => {
    if (pickupPlace.length > 2 && editingPickup) {
      searchLocationsByGoogle(pickupPlace, 'pickup');
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupPlace, editingPickup]);

  useEffect(() => {
    if (selectedPackage && selectedHours > 0) {
      calculatePricing();
    }
  }, [selectedPackage, selectedHours]);

  const fetchHourlyPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await apiGet('/api/list_all_package/');
      if (response.data && response.data.status === 'success') {
        const activePackages = response.data.data.filter((pkg: HourlyPackage) => pkg.is_active);
        setHourlyPackages(activePackages);
      }
    } catch (error) {
      console.error('Failed to fetch hourly packages:', error);
      Alert.alert('Error', 'Failed to load hourly packages');
    } finally {
      setPackagesLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!selectedPackage) return;

    const baseHours = selectedPackage.package_hours;
    const baseKm = selectedPackage.package_km;
    const basePrice = parseFloat(selectedPackage.package_price);
    const extraHrRate = parseFloat(selectedPackage.extra_hr_rate);
    const kmPerHour = baseKm / baseHours;

    let totalHours = selectedHours;
    let totalKm = Math.round(kmPerHour * totalHours);
    let price = basePrice;

    if (totalHours > baseHours) {
      const extraHours = totalHours - baseHours;
      price += extraHours * extraHrRate;
    }

    setCalculatedKm(totalKm);
    setTotalPrice(price);
  };

  const getCurrentLocation = async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        const defaultLocation: LocationType = {
          id: 'default',
          name: 'Bangalore',
          address: 'Bangalore, Karnataka, India',
          latitude: 12.9716,
          longitude: 77.5946,
        };
        if (isMounted.current) {
          setCurrentLocation(defaultLocation);
          setStartLocationQuery(defaultLocation.name);
          setLoading(false);
        }
        return;
      }

      if (!isMounted.current) {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const currentLoc: LocationType = {
        id: 'current',
        name: 'Current Location',
        address: 'Your current location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      if (isMounted.current) {
        setCurrentLocation(currentLoc);
        setStartLocationQuery('Current Location');
      }
      
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
          const locationName = address.name || address.street || 'Current Location';
          
          currentLoc.address = fullAddress;
          currentLoc.name = locationName;
          
          if (isMounted.current) {
            setCurrentLocation({ ...currentLoc });
            setStartLocationQuery(locationName);
          }
        }
      } catch (geocodeError) {
        // console.log('Reverse geocoding failed:', geocodeError);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Using default location.');
      const defaultLocation: LocationType = {
        id: 'default',
        name: 'Bangalore',
        address: 'Bangalore, Karnataka, India',
        latitude: 12.9716,
        longitude: 77.5946,
      };
      if (isMounted.current) {
        setCurrentLocation(defaultLocation);
        setStartLocationQuery(defaultLocation.name);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const searchLocationsByGoogle = async (query: string, type: 'start' | 'destination' | 'pickup') => {
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
        await searchLocations(query, type);
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
        await searchLocations(query, type);
        return;
      }

      if (isMounted.current) {
        if (type === "destination") {
          setLocationSuggestions(validLocations as LocationType[]);
        } else if (type === "start") {
          setStartLocationSuggestions(validLocations as LocationType[]);
        } else if (type === "pickup") {
          setPickupSuggestions(validLocations as LocationType[]);
        }
      }
    } catch (error) {
      console.error("Google Places search error:", error);
      if (isMounted.current) {
        await searchLocations(query, type);
      }
    } finally {
      if (isMounted.current) {
        setSearchLoading(false);
      }
    }
  };

  const searchLocations = async (query: string, type: 'start' | 'destination' | 'pickup') => {
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
        if (type === 'destination') {
          setLocationSuggestions(locations);
        } else if (type === 'start') {
          setStartLocationSuggestions(locations);
        } else if (type === 'pickup') {
          setPickupSuggestions(locations);
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
      if (isMounted.current) {
        if (type === 'destination') {
          setLocationSuggestions([]);
        } else if (type === 'start') {
          setStartLocationSuggestions([]);
        } else if (type === 'pickup') {
          setPickupSuggestions([]);
        }
      }
    } finally {
      if (isMounted.current) {
        setSearchLoading(false);
      }
    }
  };

  const selectDestination = (location: LocationType) => {
    setDestination(location);
    setDestinationQuery(location.name);
    setLocationSuggestions([]);
    setEditingDestination(false);
  };

  const selectStartLocation = (location: LocationType) => {
    setCurrentLocation(location);
    setStartLocationQuery(location.name);
    setStartLocationSuggestions([]);
    setEditingStartLocation(false);
  };

  const selectPickupLocation = (location: LocationType) => {
    setSelectedPickupLocation(location);
    setPickupPlace(location.name);
    setPickupSuggestions([]);
    setEditingPickup(false);
  };

  const selectPackage = (pkg: HourlyPackage) => {
    setSelectedPackage(pkg);
    setSelectedHours(pkg.package_hours);
  };

  const adjustHours = (increment: boolean) => {
    if (!selectedPackage) return;
    
    if (increment) {
      setSelectedHours(selectedHours + 1);
    } else {
      // Don't allow reducing below the package's minimum hours
      const newHours = Math.max(selectedPackage.package_hours, selectedHours - 1);
      setSelectedHours(newHours);
    }
  };

  const handleBookPackage = async () => {
    // Validation
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package');
      return;
    }
    
    if (!selectedPickupLocation) {
      Alert.alert('Error', 'Please select pickup location');
      return;
    }
    
    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        customer_id: 1, // You might want to get this from user context/storage
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
      console.log("responce", response);
      
      if (response.status === 201) {
        Alert.alert('Success', 'Package booked successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/tracking')
          }
        ]);
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

  const handleContinue = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    router.push({
      pathname: '/booking/vehicle-selection',
      params: {
        startLocationLabel: currentLocation.name,
        startLocationLat: currentLocation.latitude,
        startLocationLon: currentLocation.longitude,
        endLocationLabel: destination.name,
        endLocationLat: destination.latitude,
        endLocationLon: destination.longitude,
        roundTrip: roundTrip ? 'true' : 'false',
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Booking Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeButton, bookingMode === 'trip' && styles.activeModeButton]}
          onPress={() => setBookingMode('trip')}
        >
          <Text style={[styles.modeButtonText, bookingMode === 'trip' && styles.activeModeButtonText]}>
            Single / Round Trip
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, bookingMode === 'hourly' && styles.activeModeButton]}
          onPress={() => setBookingMode('hourly')}
        >
          <Text style={[styles.modeButtonText, bookingMode === 'hourly' && styles.activeModeButtonText]}>
            Hourly Package
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {bookingMode === 'trip' ? (
          /* Existing Trip Booking UI */
          <View>
            <View style={styles.locationInputs}>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={startLocationQuery}
                  onChangeText={setStartLocationQuery}
                  placeholder="Pickup location"
                  onFocus={() => setEditingStartLocation(true)}
                />
                <TouchableOpacity onPress={getCurrentLocation}>
                  <MaterialCommunityIcons name="navigation" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setEditingStartLocation(!editingStartLocation)}
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={destinationQuery}
                  onChangeText={setDestinationQuery}
                  placeholder="Where to? (e.g., Chennai, Airport)"
                  onFocus={() => setEditingDestination(true)}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Hourly Package UI */
          <View>
            {packagesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading packages...</Text>
              </View>
            ) : (
              <View>
                {/* Package Selection */}
                <View style={styles.packageContainer}>
                  <Text style={styles.sectionTitle}>Select Package</Text>
                  {hourlyPackages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        selectedPackage?.id === pkg.id && styles.selectedPackageCard
                      ]}
                      onPress={() => selectPackage(pkg)}
                    >
                      <View style={styles.packageHeader}>
                        <Text style={styles.packageTitle}>{pkg.vehicle_model}</Text>
                        <Text style={styles.packageCapacity}>Capacity: {pkg.capacity}</Text>
                      </View>
                      <View style={styles.packageDetails}>
                        <Text style={styles.packageInfo}>{pkg.package_hours} Hours • {pkg.package_km} KM</Text>
                        <Text style={styles.packagePrice}>₹{pkg.package_price}</Text>
                      </View>
                      <View style={styles.packageRates}>
                        <Text style={styles.rateText}>Extra KM: ₹{pkg.extra_km_rate}/km</Text>
                        <Text style={styles.rateText}>Extra Hour: ₹{pkg.extra_hr_rate}/hr</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedPackage && (
                  <View>
                    {/* Hour Selection */}
                    <View style={styles.hourSelectionContainer}>
                      <Text style={styles.sectionTitle}>Select Hours</Text>
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

                    {/* Booking Form */}
                    <View style={styles.bookingForm}>
                      <Text style={styles.sectionTitle}>Booking Details</Text>
                      
                      {/* Pickup Place */}
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#10B981" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={pickupPlace}
                          onChangeText={setPickupPlace}
                          placeholder="Pickup place"
                          onFocus={() => setEditingPickup(true)}
                        />
                      </View>

                    {editingPickup && pickupSuggestions.length > 0 && (
              <>
                <Text style={styles.suggestionHeader}>Pickup Locations</Text>
                {pickupSuggestions.map((location) => (
                  <TouchableOpacity
                    key={`pickup-${location.id}`}
                    style={styles.suggestionItem}
                    onPress={() => selectPickupLocation(location)}
                  >
                    <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>{location.name}</Text>
                      <Text style={styles.suggestionAddress}>{location.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

                      {/* Date and Time */}
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
                            {pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                          placeholder="Pickup address"
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
                  </View>
                )}
              </View>
            )}
          </View>
        )}

 

        {/* Suggestions */}
        {(locationSuggestions.length > 0 || startLocationSuggestions.length > 0 || pickupSuggestions.length > 0) && (
          <View style={styles.suggestionsContainer}>
            {editingStartLocation && startLocationSuggestions.length > 0 && (
              <>
                <Text style={styles.suggestionHeader}>Pickup Locations</Text>
                {startLocationSuggestions.map((location) => (
                  <TouchableOpacity
                    key={`start-${location.id}`}
                    style={styles.suggestionItem}
                    onPress={() => selectStartLocation(location)}
                  >
                    <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>{location.name}</Text>
                      <Text style={styles.suggestionAddress}>{location.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {!editingStartLocation && editingDestination && locationSuggestions.length > 0 && (
              <>
                <Text style={styles.suggestionHeader}>Destinations</Text>
                {locationSuggestions.map((location) => (
                  <TouchableOpacity
                    key={`dest-${location.id}`}
                    style={styles.suggestionItem}
                    onPress={() => selectDestination(location)}
                  >
                    <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>{location.name}</Text>
                      <Text style={styles.suggestionAddress}>{location.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

               {bookingMode == "trip" && 
        <View style={styles.roundTripContainer}>
              <Switch
                value={roundTrip}
                onValueChange={() => setRoundTrip(!roundTrip)}
                trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                thumbColor={roundTrip ? "#10B981" : "#f4f3f4"}
                style={styles.roundTripCheckbox}
              />
              <Text style={styles.roundTripLabel}>Round Trip</Text>
            </View>
        }


      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {bookingMode === 'trip' ? (
          <TouchableOpacity
            style={[styles.continueButton, !destination && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!destination}
          >
            <Text style={styles.continueButtonText}>Select Vehicle</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.continueButton, 
              (!selectedPackage || !selectedPickupLocation || !pickupAddress.trim() || bookingLoading) && styles.disabledButton
            ]}
            onPress={handleBookPackage}
            disabled={!selectedPackage || !selectedPickupLocation || !pickupAddress.trim() || bookingLoading}
          >
            {bookingLoading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.continueButtonText}>Booking...</Text>
              </>
            ) : (
              <>
                <Text style={styles.continueButtonText}>Book Package</Text>
                <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfTravel}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateOfTravel(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickupTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setPickupTime(selectedTime);
            }
          }}
        />
      )}
    </SafeAreaView>
  );

  function calculateDistance(): number {
    if (!currentLocation || !destination) return 0;
    
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#10B981',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeModeButtonText: {
    color: '#ffffff',
  },
  locationInputs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  roundTripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  roundTripCheckbox: {
    marginRight: 8,
  },
  roundTripLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  packageContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  packageCard: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  selectedPackageCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageCapacity: {
    fontSize: 14,
    color: '#6B7280',
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageInfo: {
    fontSize: 14,
    color: '#374151',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  packageRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  hourSelectionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
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
  bookingForm: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  suggestionsContainer: {
    maxHeight: 250,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});