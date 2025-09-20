import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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
    const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;
    const response = await apiPost('/api/register/', {
      contact: authMethod === 'email' ? email : formattedMobile,
      type: authMethod === 'email' ? 'email' : 'phone',
    });
    if (response.status == 200) {
      setOtpSent(true);
      setResendTimer(30);
      setCanResend(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
    try {
      const response = await apiPost('/api/verify_otp/', {
        contact,
        otp,
      });
      if (response.data.status === 'success' && response.data.temp_key) {
        setOtpVerified(true);
        setTempKey(response.data.temp_key);
        // Alert.alert('Success', 'OTP verified successfully.');
      } else {
        setOtpVerified(false);
        setTempKey('');
        Alert.alert('Error', response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      setOtpVerified(false);
      setTempKey('');
      Alert.alert('Error', 'OTP verification failed');
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
        //if mobile not start with +91 add +91
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>NANO Taxi</Text>
        <Text style={styles.subtitle}>
          {isSignup ? 'Create your account' : 'Welcome back!'}
        </Text>
        <View style={styles.form}>
          {/* Select Email or Mobile */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: authMethod === 'email' ? '#10B981' : '#F3F4F6',
                padding: 8,
                borderRadius: 8,
                marginRight: 8,
              }}
              onPress={() => setAuthMethod('email')}
            >
              <Text style={{ color: authMethod === 'email' ? '#fff' : '#10B981', fontWeight: 'bold' }}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: authMethod === 'mobile' ? '#10B981' : '#F3F4F6',
                padding: 8,
                borderRadius: 8,
              }}
              onPress={() => setAuthMethod('mobile')}
            >
              <Text style={{ color: authMethod === 'mobile' ? '#fff' : '#10B981', fontWeight: 'bold' }}>Mobile</Text>
            </TouchableOpacity>
          </View>
          {/* Email or Mobile Input */}
          {authMethod === 'email' ? (
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={{
                minWidth: 54,
                paddingHorizontal: 8,
                paddingVertical: 16,
                backgroundColor: '#F3F4F6',
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRightWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 16, color: '#374151' }}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, {
                  flex: 1,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeftWidth: 0,
                  width: '100%',
                  paddingLeft: 12,
                }]}
                placeholder="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
          )}
          {/* Signup: Send OTP and OTP field */}
          {isSignup && !otpSent && (
            <TouchableOpacity
              style={[styles.authButton, { marginBottom: 0 }]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>Send OTP</Text>
            </TouchableOpacity>
          )}
          {isSignup && otpSent && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!otpVerified}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.authButton, {
                    flex: 1,
                    backgroundColor: otpVerified ? '#22c55e' : '#fde047',
                    borderColor: otpVerified ? '#22c55e' : '#fde047',
                    borderWidth: 1,
                    marginTop: 0,
                  }]}
                  onPress={otpVerified ? undefined : handleVerifyOtp}
                  disabled={otpVerified}
                >
                  <Text style={[styles.authButtonText, { color: otpVerified ? '#fff' : '#374151' }]}>Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButton, {
                    flex: 1,
                    backgroundColor: canResend ? '#10B981' : '#9CA3AF',
                    marginTop: 0,
                  }]}
                  onPress={canResend ? handleSendOtp : undefined}
                  disabled={!canResend || otpVerified}
                >
                  <Text style={styles.authButtonText}>
                    {canResend ? 'Resend OTP' : `Resend OTP (${resendTimer}s)`}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Password fields only after OTP verified */}
              {otpVerified && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={[styles.authButton, { backgroundColor: '#22c55e', marginTop: 8 }]}
                    onPress={handleSetPassword}
                    disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.authButtonText}>Set Password</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          {/* Password fields for login only */}
          {!isSignup && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.authButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
            }}
          >
            <Text style={styles.switchButtonText}>
              {isSignup
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipButtonText}>Skip & Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  authButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchButtonText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
});