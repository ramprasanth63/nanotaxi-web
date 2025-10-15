import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LocationScreen from '../booking/location';

export default function HomeScreen() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  // Add this state at the top of your component
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  // Add this function to handle language change
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  // Add this function to handle opening browser link
  const openPlansAndPricing = () => {
    Linking.openURL('https://nanotaxibooking.com');  // Replace with your actual URL
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {/* {isLoggedIn ? `Hello, ${user?.username}!` : 'Welcome!'} */}
            NANO Taxi
          </Text>
          <Text style={styles.subGreeting}>Where would you like to go?</Text>
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => isLoggedIn ? router.push('/profile') : router.push('/auth/login')}
        >
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
          ) : (
            <MaterialCommunityIcons name="account" size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
     </View>

      <View style={styles.topToolbar}>
        <TouchableOpacity 
          style={styles.plansButton}
          onPress={openPlansAndPricing}
        >
          <Text style={styles.plansButtonText}>Plans & Pricing Info</Text>
        </TouchableOpacity>
      
        {/* <View style={styles.languageToggle}>
          <TouchableOpacity 
            style={[
              styles.languageButton,
              language === 'en' && styles.languageButtonActive
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[
              styles.languageText,
              language === 'en' && styles.languageTextActive
            ]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.languageButton,
              language === 'ta' && styles.languageButtonActive
            ]}
            onPress={() => setLanguage('ta')}
          >
            <Text style={[
              styles.languageText,
              language === 'ta' && styles.languageTextActive
            ]}>தமிழ்</Text>
          </TouchableOpacity>
        </View> */}
      </View>

       

      {/* <View style={styles.content}>
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg' }}
            style={styles.heroImage}
          />
          <Text style={styles.heroTitle}>Quick & Reliable Rides</Text>
          <Text style={styles.heroSubtitle}>Book your ride in just a few taps</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push('/booking/location')}
        >
          <MaterialCommunityIcons name="map-marker" size={24} color="#ffffff" style={styles.bookButtonIcon} />
          <Text style={styles.bookButtonText}>Book a Journey</Text>
        </TouchableOpacity>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8★</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5min</Text>
            <Text style={styles.statLabel}>Avg Pickup Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      </View> */}
      <LocationScreen/>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroImage: {
    width: 200,
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bookButtonIcon: {
    marginRight: 12,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  plansButton: {
    backgroundColor: '#16A349',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  plansButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  languageButtonActive: {
    backgroundColor: '#16A349',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  languageTextActive: {
    color: '#fff',
  },
});