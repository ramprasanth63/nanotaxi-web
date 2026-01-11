// File: app/(tabs)/guest.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { apiPost } from "@/services/apiClient";
import { GuestBooking, Location, Vehicle } from "@/types";

// ---------------- Translations ----------------
const translations: Record<string, Record<string, string>> = {
  en: {
    guestBooking: "Guest Booking",
    enterDetails: "Enter your details to continue",
    tripSummary: "Trip Summary",
    email: "Email address",
    phone: "Phone number",
    address: "Full address",
    contactInfo: "Contact Information",
    confirmBooking: "Confirm Booking",
    bookingConfirmed: "Booking Confirmed!",
    bookingMsg: "Your ride has been booked successfully. You will receive updates via SMS and email.",
    haveAccount: "Have an account? Login for a better experience",
    bookingFailed: "Failed to book ride. Please try again.",
    fillFields: "Please fill in all required fields",
    validEmail: "Please enter a valid email address",
    validPhone: "Please enter a valid phone number",
    infoText: "We'll send booking confirmation and driver details to your email and phone number.",
    booking: "Booking...",
    bookingDetailsMissing: "Booking details missing.",
    ok: "OK",
    startLocation: "Start Location",
    endLocation: "End Location",
    fare: "Fare",
    vehicle: "Vehicle",
  },
  ta: {
    guestBooking: "விருந்தினர் முன்பதிவு",
    enterDetails: "தயவுசெய்து உங்கள் விவரங்களை உள்ளிடவும்",
    tripSummary: "பயண சுருக்கம்",
    email: "மின்னஞ்சல் முகவரி",
    phone: "தொலைபேசி எண்",
    address: "முழு முகவரி",
    contactInfo: "தொடர்பு தகவல்",
    confirmBooking: "முன்பதிவை உறுதிப்படுத்தவும்",
    bookingConfirmed: "முன்பதிவு உறுதிசெய்யப்பட்டது!",
    bookingMsg: "உங்கள் பயணம் வெற்றிகரமாக முன்பதிவு செய்யப்பட்டது. SMS மற்றும் மின்னஞ்சல் மூலம் தகவல்கள் கிடைக்கும்.",
    haveAccount: "ஏற்கனவே கணக்கு உள்ளதா? சிறந்த அனுபவத்திற்காக உள்நுழைக",
    bookingFailed: "முன்பதிவு தோல்வியுற்றது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
    fillFields: "அனைத்து புலங்களையும் பூர்த்தி செய்யவும்",
    validEmail: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்",
    validPhone: "சரியான தொலைபேசி எண்ணை உள்ளிடவும்",
    infoText: "உங்கள் மின்னஞ்சல் மற்றும் தொலைபேசி எண்ணிற்கு முன்பதிவு உறுதிப்படுத்தல் மற்றும் ஓட்டுநர் விவரங்கள் அனுப்பப்படும்.",
    booking: "முன்பதிவு செய்யப்படுகிறது...",
    bookingDetailsMissing: "முன்பதிவு விவரங்கள் காணப்படவில்லை.",
    ok: "சரி",
    startLocation: "தொடக்க இடம்",
    endLocation: "இலக்கு இடம்",
    fare: "கட்டணம்",
    vehicle: "வாகனம்",
  },
};

// Safe language hook with fallback
const useSafeLanguage = () => {
  try {
    // Try to import and use the language hook from tabs
    const { useLanguage } = require("../(tabs)/index");
    const languageContext = useLanguage?.();
    
    if (languageContext && languageContext.language) {
      return languageContext.language;
    }
  } catch (error) {
    console.log("Language context not available, using default: en");
  }
  
  // Fallback to English
  return 'en';
};

// ---------------- Main Component ----------------
function GuestBookingScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Use safe language hook
  const language = useSafeLanguage();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const t = (key: string) => translations[language]?.[key] || translations["en"][key] || key;

  const safeParse = <T,>(value: string | undefined): T | null => {
    if (!value || value === "undefined" || value === "null") return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const startLocation: Location | null = safeParse<Location>(params.startLocation as string);
  const endLocation: Location | null = safeParse<Location>(params.endLocation as string);
  const vehicle: Vehicle | null = safeParse<Vehicle>(params.vehicle as string);
  const fare: number = Number(params.fare) || 0;
  const pickupInstructions: string = (params.pickupInstructions as string) || "";

  const validateForm = (): boolean => {
    if (!email.trim() || !phone.trim() || !address.trim()) {
      Alert.alert(t("fillFields"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("validEmail"));
      return false;
    }
    if (!phoneRegex.test(phone.replace(/\D/g, "").slice(-10))) {
      Alert.alert(t("validPhone"));
      return false;
    }
    return true;
  };

  const handleGuestBooking = async () => {
    if (loading) return;
    if (!validateForm()) return;
    if (!startLocation || !endLocation || !vehicle) {
      Alert.alert(t("bookingDetailsMissing"));
      return;
    }

    setLoading(true);
    try {
      const guestBookingData: GuestBooking = {
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        startLocation,
        endLocation,
        vehicle,
      };

      const response = await apiPost("/api/guests/bookings", {
        ...guestBookingData,
        fare,
        pickupInstructions,
      });

      if (response && response.success !== false) {
        Alert.alert(t("bookingConfirmed"), t("bookingMsg"), [
          { text: t("ok"), onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        Alert.alert(t("bookingFailed"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("bookingFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getVehicleDisplayName = (vehicle: Vehicle | null) => {
    if (!vehicle) return "";
    return vehicle.name || `${vehicle.type} - ${vehicle.seats} seats`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t("guestBooking")}</Text>
            <Text style={styles.headerSubtitle}>{t("enterDetails")}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Trip Summary */}
          <View style={styles.tripSummary}>
            <Text style={styles.summaryTitle}>{t("tripSummary")}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#10B981" />
                <Text style={styles.summaryLabel}>{t("startLocation")}:</Text>
              </View>
              <Text style={styles.summaryValue}>{startLocation?.name || "-"}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
                <Text style={styles.summaryLabel}>{t("endLocation")}:</Text>
              </View>
              <Text style={styles.summaryValue}>{endLocation?.name || "-"}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
                <Text style={styles.summaryLabel}>{t("fare")}:</Text>
              </View>
              <Text style={styles.summaryValue}>₹{fare}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
                <Text style={styles.summaryLabel}>{t("vehicle")}:</Text>
              </View>
              <Text style={styles.summaryValue}>{getVehicleDisplayName(vehicle)}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t("contactInfo")}</Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t("email")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t("phone")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="home-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder={t("address")}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#1E3A8A" />
              <Text style={styles.infoText}>{t("infoText")}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleGuestBooking}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={loading ? "loading" : "check-circle-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.confirmButtonText}>
              {loading ? t("booking") : `${t("confirmBooking")} - ₹${fare}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={() => router.push("/auth/login")}
          >
            <MaterialCommunityIcons name="account-arrow-right" size={16} color="#3B82F6" />
            <Text style={styles.loginPromptText}>{t("haveAccount")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function GuestBookingScreen() {
  return <GuestBookingScreenContent />;
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 24 },
  tripSummary: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: 14, color: "#374151", marginLeft: 8, fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#6B7280", flex: 1, textAlign: "right" },
  form: { marginTop: 32, marginBottom: 16 },
  formTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  inputIcon: { marginRight: 12, marginTop: 2 },
  input: { flex: 1, fontSize: 16, color: "#1F2937", padding: 0 },
  addressInput: { minHeight: 80, textAlignVertical: "top" },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: { fontSize: 14, color: "#1E3A8A", marginLeft: 8, flex: 1, lineHeight: 20 },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonDisabled: { backgroundColor: "#9CA3AF", opacity: 0.7 },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loginPrompt: {
    alignItems: "center",
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loginPromptText: { fontSize: 14, color: "#3B82F6", fontWeight: "500" },
});
