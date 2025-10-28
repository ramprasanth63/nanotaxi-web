import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (otpSent && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (otpSent && resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [otpSent, resendTimer]);

  const handleSendOtp = async () => {
    if (authMethod === 'email' && !email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (authMethod === 'mobile' && !mobile.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    setLoading(true);
    const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;
    try {
      const response = await apiPost('/api/register/', {
        contact: authMethod === 'email' ? email : formattedMobile,
        type: authMethod === 'email' ? 'email' : 'phone',
      });
      if (response.status == 200) {
        setOtpSent(true);
        setResendTimer(30);
        setCanResend(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setLoading(true);
    const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
    try {
      const response = await apiPost('/api/verify_otp/', {
        contact,
        otp,
      });
      if (response.data.status === 'success' && response.data.temp_key) {
        setOtpVerified(true);
        setTempKey(response.data.temp_key);
      } else {
        setOtpVerified(false);
        setTempKey('');
        Alert.alert('Error', response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      setOtpVerified(false);
      setTempKey('');
      Alert.alert('Error', 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please enter and confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!tempKey) {
      Alert.alert('Error', 'OTP not verified');
      return;
    }
    setLoading(true);
    try {
      const resp = await apiPost('/api/set_password/', {
        temp_key: tempKey,
        password: password,
      });
      if (resp.data && resp.data.status === 'success') {
        await SecureStore.setItemAsync('user_contact', authMethod === 'email' ? email : mobile);
        await SecureStore.setItemAsync('user_type', authMethod);
        await SecureStore.setItemAsync('user_logged_in', 'true');
        const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
        const loginResponse = await login(contact, password);
        if (loginResponse) {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', (resp.data && resp.data.message) || 'Account creation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isSignup) {
      return;
    } else {
      if (authMethod === 'email' && !email.trim()) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }
      if (authMethod === 'mobile' && !mobile.trim()) {
        Alert.alert('Error', 'Please enter your mobile number');
        return;
      }
      if (!password.trim()) {
        Alert.alert('Error', 'Please enter your password');
        return;
      }
      setLoading(true);
      try {
        const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
        const success = await login(contact, password);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Error', 'Login failed');
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        style={styles.gradientHeader}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={48} color="#ffffff" />
          </View>
          <Text style={styles.title}>NANO Taxi</Text>
          <Text style={styles.headerSubtitle}>Your ride, simplified</Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isSignup ? 'Sign up to get started' : 'Login to continue'}
              </Text>
            </View>

            <View style={styles.form}>
              {/* Auth Method Selector */}
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    authMethod === 'email' && styles.methodButtonActive,
                  ]}
                  onPress={() => setAuthMethod('email')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="mail"
                    size={20}
                    color={authMethod === 'email' ? '#ffffff' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      authMethod === 'email' && styles.methodButtonTextActive,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    authMethod === 'mobile' && styles.methodButtonActive,
                  ]}
                  onPress={() => setAuthMethod('mobile')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={20}
                    color={authMethod === 'mobile' ? '#ffffff' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      authMethod === 'mobile' && styles.methodButtonTextActive,
                    ]}
                  >
                    Mobile
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email or Mobile Input */}
              {authMethod === 'email' ? (
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.mobileInput]}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#9CA3AF"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={10}
                  />
                </View>
              )}

              {/* Signup: Send OTP */}
              {isSignup && !otpSent && (
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* OTP Input and Verification */}
              {isSignup && otpSent && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!otpVerified}
                      placeholderTextColor="#9CA3AF"
                    />
                    {otpVerified && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.verifiedIcon} />
                    )}
                  </View>

                  <View style={styles.otpButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        { flex: 1 },
                        otpVerified && styles.verifiedButton,
                        loading && styles.disabledButton,
                      ]}
                      onPress={otpVerified ? undefined : handleVerifyOtp}
                      disabled={otpVerified || loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color={otpVerified ? "#ffffff" : "#10B981"} />
                      ) : (
                        <Text style={[styles.secondaryButtonText, otpVerified && styles.verifiedButtonText]}>
                          {otpVerified ? '✓ Verified' : 'Verify'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        { flex: 1 },
                        !canResend && styles.disabledButton,
                        loading && styles.disabledButton,
                      ]}
                      onPress={canResend ? handleSendOtp : undefined}
                      disabled={!canResend || otpVerified || loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#10B981" />
                      ) : (
                        <Text style={styles.secondaryButtonText}>
                          {canResend ? 'Resend' : `${resendTimer}s`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Password fields after OTP verification */}
                  {otpVerified && (
                    <>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Create password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={22}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={22}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          loading && styles.disabledButton,
                          (!password || !confirmPassword || password !== confirmPassword) && styles.disabledButton,
                        ]}
                        onPress={handleSetPassword}
                        disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Create Account</Text>
                            <Ionicons name="checkmark" size={20} color="#ffffff" />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* Login Password Field */}
              {!isSignup && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.disabledButton]}
                    onPress={handleAuth}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Login</Text>
                        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Switch between Login/Signup */}
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsSignup(!isSignup);
                  setOtpSent(false);
                  setOtp('');
                  setOtpVerified(false);
                  setTempKey('');
                  setPassword('');
                  setConfirmPassword('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchButtonText}>
                  {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={styles.switchButtonTextBold}>
                    {isSignup ? 'Login' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    gap: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  methodButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  methodButtonTextActive: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  mobileInput: {
    paddingLeft: 0,
  },
  countryCode: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 4,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  verifiedButtonText: {
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    borderColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  otpButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  switchButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchButtonTextBold: {
    fontWeight: '600',
    color: '#10B981',
  },
});