import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <BookingProvider>
        <LanguageProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="booking" />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </LanguageProvider>
      </BookingProvider>
    </AuthProvider>
  );
}