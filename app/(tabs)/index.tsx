import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
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

function HomeScreenContent() {
  const { user, isLoggedIn } = useAuth();
  const { lang, setLanguage } = useLanguage();
  const router = useRouter();

  const openPlansAndPricing = () =>
    Linking.openURL('https://nanotaxibooking.com');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {lang === 'en' ? 'NANO Taxi' : 'நானோ டாக்சி'}
          </Text>
          <Text style={styles.subGreeting}>
            {lang === 'en'? 'Where would you like to go?' : 'நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்?'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() =>
            isLoggedIn ? router.push('/profile') : router.push('/auth/login')
          }
        >
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <MaterialCommunityIcons name="account" size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity
          style={styles.plansButton}
          onPress={openPlansAndPricing}
        >
          <Text style={styles.plansButtonText}>
            {lang === 'en'
              ? 'Plans & Pricing Info'
              : 'திட்டங்கள் மற்றும் விலை தகவல்'}
          </Text>
        </TouchableOpacity>

        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              lang === 'en' && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.languageText,
                lang === 'en' && styles.languageTextActive,
              ]}
            >
              EN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              lang === 'ta' && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage('ta')}
          >
            <Text
              style={[
                styles.languageText,
                lang === 'ta' && styles.languageTextActive,
              ]}
            >
              தமிழ்
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Screen */}
      <LocationScreen />
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return <HomeScreenContent />;
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
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subGreeting: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: { width: 48, height: 48, borderRadius: 24 },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  plansButton: {
    backgroundColor: '#16A349',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  plansButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
  languageButtonActive: { backgroundColor: '#16A349' },
  languageText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  languageTextActive: { color: '#fff' },
});