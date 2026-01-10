import { Tabs } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function TabLayout() {
  return (
    <LanguageProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'My Rides',
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons name="map-marker" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
    </Tabs>
    </LanguageProvider>
  );
}