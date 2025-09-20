import { apiPost, fetchBaseURL } from '@/services/apiClient';
import { Location, Vehicle } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Use the ORS Matrix API for real driving distance calculation
const OPENROUTESERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3MDRkYTQ3MWYxNDRiMTdiODBiMGViNzQwZTZiY2NjIiwiaCI6Im11cm11cjY0In0=";
const GOOGLE_MAPS_API_KEY = "AIzaSyCy9vw9wy_eZeYd4BO9ifFiky2vOfvB-zc";
export default function VehicleSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
    const [showBreakdown, setShowBreakdown] = useState(false);
        const [pickupOption, setPickupOption] = useState<'now' | 'schedule'>('now');
    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [pickupTime, setPickupTime] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

  // Use Option A: parse location objects as JSON
  let startLocation: Location;
  let endLocation: Location;

  try {
    startLocation = JSON.parse(params.startLocation as string);
    endLocation = JSON.parse(params.endLocation as string);
  } catch (e) {
    // fallback: reconstruct from individual params if needed
    startLocation = {
      name: (params.startLocationLabel as string) || "",
      latitude: Number(params.startLocationLat),
      longitude: Number(params.startLocationLon),
      address: "",
      id: "start",
    };
    endLocation = {
      name: (params.endLocationLabel as string) || "",
      latitude: Number(params.endLocationLat),
      longitude: Number(params.endLocationLon),
      address: "",
      id: "end",
    };
  }

  useEffect(() => {
    fetchVehicles();
    // Calculate driving distance via ORS
    (async () => {
      let dist = await getGoogleDrivingDistance(startLocation, endLocation);

      if (!dist || dist.distanceKm === 0) {
        dist = await getORSDrivingDistance(startLocation, endLocation);
      }
      setDistance(dist);
    })();
  }, []);

  useEffect(() => {
    if (selectedVehicle && distance !== null) {
      calculateFare(selectedVehicle, distance);
    }
  }, [selectedVehicle, distance]);

  const fetchVehicles = async () => {
    try {
      // Use apiPost for vehicle availability
      console.log("Fetching available vehicles...", {
        start_point: startLocation.name,
        end_point: endLocation.name,
      });
      const response = await apiPost(
        '/api/get_vehicle_available/',
        {
          start_point: startLocation.name,
          end_point: endLocation.name,
        }
      );
      // console.log("Vehicle fetch response:", response.data);
      const baseurl = await fetchBaseURL();
      // console.log("Base URL for images:", baseurl);
      // add baseurl to vehicle image URLs
      const vehiclesWithImages = response.data.available_vehicles.map((vehicle: Vehicle) => ({
        ...vehicle,
        image: `${baseurl}${vehicle.image}`,
      }));
      setVehicles(vehiclesWithImages);
    } catch (error) {
      // console.error('Vehicle fetch error:', error);
      // Mock vehicles for demo
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          type: 'Mini',
          name: 'Namma Mini',
          pricePerKm: 12,
          image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
          capacity: 4,
        },
        {
          id: '2',
          type: 'Sedan',
          name: 'Namma Sedan',
          pricePerKm: 16,
          image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
          capacity: 4,
        },
        {
          id: '3',
          type: 'SUV',
          name: 'Namma SUV',
          pricePerKm: 22,
          image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg',
          capacity: 6,
        },
        {
          id: '4',
          type: 'Premium',
          name: 'Namma Premium',
          pricePerKm: 28,
          image: 'https://images.pexels.com/photos/1719648/pexels-photo-1719648.jpeg',
          capacity: 4,
        },
      ];
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  async function getGoogleDrivingDistance(start: Location, end: Location): Promise<number> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.rows &&
      data.rows[0] &&
      data.rows[0].elements &&
      data.rows[0].elements[0] &&
      data.rows[0].elements[0].distance
    ) {
      // Convert meters to kilometers
      return data.rows[0].elements[0].distance.value / 1000;
    }

    return 0;
  } catch (error) {
    console.error("Google Driving Distance error:", error);
    return 0;
  }
}


  // Use ORS Matrix API for driving distance!
  async function getORSDrivingDistance(start: Location, end: Location): Promise<number> {
    try {
      const url = "https://api.openrouteservice.org/v2/matrix/driving-car";
      const body = JSON.stringify({
        locations: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        metrics: ["distance"]
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": OPENROUTESERVICE_API_KEY,
          "Content-Type": "application/json",
        },
        body,
      });
      const data = await response.json();
      if (data.distances && data.distances[0] && data.distances[0][1]) {
        return data.distances[0][1] / 1000; // meters to km
      }
      return 0;
    } catch (error) {
      console.error("ORS Driving Distance error:", error);
      return 0;
    }
  }

  // Calculate fare using driving distance
  const calculateFare = async (vehicle: Vehicle, dist: number) => {
    // console.log("Calculating fare for", vehicle.name, "over", dist, "km");
    try {
      // Try your fare API first
      try {
        const baseFare = dist * vehicle.pricePerKm;
        const driverFee = dist > 200 ? 300 : 0;
        const totalFare = baseFare + driverFee;
        setFare(Math.round(totalFare));
      } catch (error) {
        console.error('Fare API error, using local calc:', error);
      }
    } catch (error) {
      console.error('Fare calculation error:', error);
    }
  };

  const handleContinue = () => {
    if (!selectedVehicle || !fare) return;

    router.push({
      pathname: '/booking/confirmation',
      params: {
        startLocation: JSON.stringify(startLocation),
        endLocation: JSON.stringify(endLocation),
        vehicle: JSON.stringify(selectedVehicle),
        fare: fare.toString(),
        pickupOption,
        pickupDate: pickupDate ? pickupDate.toISOString() : null,
        pickupTime: pickupTime ? pickupTime.toISOString() : null,
        roundTrip: params.roundTrip as string | undefined || 'false',
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          <Text style={styles.headerSubtitle}>Choose your ride</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routeItem}>
          <View style={[styles.routeIndicator, { backgroundColor: '#10B981' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{startLocation.name}</Text>
        </View>
        <View style={styles.routeItem}>
          <View style={[styles.routeIndicator, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{endLocation.name}</Text>
        </View>
        {distance !== null && (
          <View style={styles.routeItem}>
            <MaterialCommunityIcons name="road" size={16} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={styles.routeText} numberOfLines={1}>Distance: {distance.toFixed(1)} km</Text>
          </View>
        )}
      </View>


<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
  <TouchableOpacity
    style={{
      backgroundColor: pickupOption === 'now' ? '#10B981' : '#F3F4F6',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      marginRight: 12,
    }}
    onPress={() => setPickupOption('now')}
  >
    <Text style={{ color: pickupOption === 'now' ? '#fff' : '#10B981', fontWeight: 'bold' }}>
      Now
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={{
      backgroundColor: pickupOption === 'schedule' ? '#10B981' : '#F3F4F6',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
    }}
    onPress={() => setPickupOption('schedule')}
  >
    <Text style={{ color: pickupOption === 'schedule' ? '#fff' : '#10B981', fontWeight: 'bold' }}>
      Select Date & Pickup Time
    </Text>
  </TouchableOpacity>
</View>

{pickupOption === 'schedule' && (
  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
    {/* Date Picker */}
    <TouchableOpacity
      style={{
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 12,
        minWidth: 110,
      }}
      onPress={() => setShowDatePicker(true)}
    >
      <Text style={{ color: '#10B981', fontWeight: 'bold' }}>
        {pickupDate ? pickupDate.toLocaleDateString() : 'Pick Date'}
      </Text>
    </TouchableOpacity>
    {showDatePicker && (
      <DateTimePicker
        value={pickupDate || new Date()}
        mode="date"
        display="default"
        onChange={(event, date) => {
          setShowDatePicker(false);
          if (event.type === 'set' && date) {
            setPickupDate(date);
          }
        }}
        minimumDate={new Date()}
      />
    )}

    {/* Time Picker */}
    <TouchableOpacity
      style={{
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 110,
      }}
      onPress={() => setShowTimePicker(true)}
    >
      <Text style={{ color: '#10B981', fontWeight: 'bold' }}>
        {pickupTime ? pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pick Time'}
      </Text>
    </TouchableOpacity>
    {showTimePicker && (
      <DateTimePicker
        value={pickupTime || new Date()}
        mode="time"
        display="default"
        onChange={(event, date) => {
          setShowTimePicker(false);
          if (event.type === 'set' && date) {
            setPickupTime(date);
          }
        }}
      />
    )}
  </View>
)}



      <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle?.id === vehicle.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.type}</Text>
              <View style={styles.vehicleDetails}>
                <MaterialCommunityIcons name="account-group" size={16} color="#6B7280" />
                <Text style={styles.vehicleCapacity}>{vehicle.capacity} seats</Text>
                {/* <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" style={{ marginLeft: 12 }} /> */}
                {/* <Text style={styles.vehicleTime}>2-5 min</Text> */}
              </View>
            </View>
            <View style={styles.vehiclePrice}>
              <Text style={styles.priceText}>₹{vehicle.pricePerKm}/km</Text>
              {/* {selectedVehicle?.id === vehicle.id && fare && (
                <Text style={styles.totalFare}>Total: ₹{fare}</Text>
              )} */}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {/* Price breakdown above buttons */}
                {selectedVehicle && fare && showBreakdown && (
          <View style={{ marginBottom: 12, backgroundColor: "#F3F4F6", borderRadius: 8, padding: 12 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Price Breakdown:</Text>
            <Text>Base Fare: ₹{distance && selectedVehicle ? Math.round(distance * selectedVehicle.pricePerKm) : 0}</Text>
            <Text>Driver Fee: ₹{distance > 200 ? 300 : 0}</Text>
            <Text style={{ fontWeight: "bold", marginTop: 6 }}>
              Total: ₹{fare}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
              Price is inclusive of GST and exclusive of toll.
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { width: '84%', marginRight: '2%' },
              !selectedVehicle && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedVehicle}
          >
            <Text style={styles.continueButtonText}>
              {fare ? `Continue - ₹${fare}` : 'Continue'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: '14%',
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              height: 56,
            }}
            onPress={() => setShowBreakdown((prev) => !prev)}
            disabled={!selectedVehicle}
          >
            <MaterialCommunityIcons
              name={showBreakdown ? "chevron-up" : "chevron-down"}
              size={28}
              color="#10B981"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
  routeInfo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  routeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  vehicleImage: {
    width: 60,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleCapacity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  vehicleTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  vehiclePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalFare: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});