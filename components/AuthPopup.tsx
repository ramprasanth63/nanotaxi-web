import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface AuthPopupProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (customerId: string) => void;
  onGuestContinue: () => void;
}

export default function AuthPopup({ visible, onClose, onLoginSuccess, onGuestContinue }: AuthPopupProps) {
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
  const [guestMode, setGuestMode] = useState(false);
  const [guestContact, setGuestContact] = useState('');
  const [guestContactType, setGuestContactType] = useState<'email' | 'mobile'>('email');
  const { login } = useAuth();

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (otpSent && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (otpSent && resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [otpSent, resendTimer]);

  const resetState = () => {
    setIsSignup(false);
    setAuthMethod('email');
    setEmail('');
    setMobile('');
    setOtpSent(false);
    setResendTimer(30);
    setCanResend(false);
    setOtp('');
    setOtpVerified(false);
    setTempKey('');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
    setGuestMode(false);
    setGuestContact('');
    setGuestContactType('email');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
    try {
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
    try {
      const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
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
        const contact = authMethod === 'email' ? email : (mobile.startsWith('+91') ? mobile : `+91${mobile}`);
        const loginResponse = await login(contact, password);
        if (loginResponse) {
          onLoginSuccess(resp.data.customer_id || '');
          handleClose();
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

  const handleLogin = async () => {
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
        onLoginSuccess(''); // Customer ID will be available from auth context
        handleClose();
      } else {
        Alert.alert('Error', 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // const handleGuestLogin = async () => {
  //   if (!guestContact.trim()) {
  //     Alert.alert('Error', 'Please enter your email or mobile number');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     let contact = guestContact.trim();
  //     let type = guestContactType;

  //     // Auto-detect if it's email or mobile
  //     if (contact.includes('@')) {
  //       type = 'email';
  //     } else {
  //       type = 'mobile';
  //       if (!contact.startsWith('+91')) {
  //         contact = `+91${contact}`;
  //       }
  //     }

  //     const response = await apiPost('/api/create_social_user/', {
  //       contact,
  //       type,
  //     });

  //     if (response.data.status === 'success') {
  //       onLoginSuccess(response.data.customer_id.toString());
  //       handleClose();
  //     } else {
  //       Alert.alert('Error', response.data.message || 'Failed to create guest account');
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to create guest account');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // if (guestMode) {
  //   return (
  //     <Modal visible={visible} animationType="slide" transparent>
  //       <View style={styles.overlay}>
  //         <KeyboardAvoidingView
  //           style={styles.container}
  //           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  //         >
  //           <View style={styles.popup}>
  //             <View style={styles.header}>
  //               <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
  //                 <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
  //               </TouchableOpacity>
  //               <Text style={styles.title}>Continue as Guest</Text>
  //             </View>

  //             <Text style={styles.subtitle}>Enter your contact details to continue</Text>

  //             <View style={styles.form}>
  //               <View style={styles.methodToggle}>
  //                 <TouchableOpacity
  //                   style={[styles.methodButton, guestContactType === 'email' && styles.activeMethodButton]}
  //                   onPress={() => setGuestContactType('email')}
  //                 >
  //                   <Text style={[styles.methodButtonText, guestContactType === 'email' && styles.activeMethodButtonText]}>
  //                     Email
  //                   </Text>
  //                 </TouchableOpacity>
  //                 <TouchableOpacity
  //                   style={[styles.methodButton, guestContactType === 'mobile' && styles.activeMethodButton]}
  //                   onPress={() => setGuestContactType('mobile')}
  //                 >
  //                   <Text style={[styles.methodButtonText, guestContactType === 'mobile' && styles.activeMethodButtonText]}>
  //                     Mobile
  //                   </Text>
  //                 </TouchableOpacity>
  //               </View>

  //               <TextInput
  //                 style={styles.input}
  //                 placeholder={guestContactType === 'email' ? 'Enter your email' : 'Enter your mobile number'}
  //                 value={guestContact}
  //                 onChangeText={setGuestContact}
  //                 keyboardType={guestContactType === 'email' ? 'email-address' : 'phone-pad'}
  //                 autoCapitalize="none"
  //               />

  //               <TouchableOpacity
  //                 style={[styles.authButton, loading && styles.disabledButton]}
  //                 onPress={handleGuestLogin}
  //                 disabled={loading}
  //               >
  //                 {loading ? (
  //                   <ActivityIndicator color="#ffffff" />
  //                 ) : (
  //                   <Text style={styles.authButtonText}>Continue as Guest</Text>
  //                 )}
  //               </TouchableOpacity>

  //               <TouchableOpacity
  //                 style={styles.switchButton}
  //                 onPress={() => setGuestMode(false)}
  //               >
  //                 <Text style={styles.switchButtonText}>Back to Login/Signup</Text>
  //               </TouchableOpacity>
  //             </View>
  //           </View>
  //         </KeyboardAvoidingView>
  //       </View>
  //     </Modal>
  //   );
  // }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.popup}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {isSignup ? 'Create Account' : 'Login to Continue'}
              </Text>
            </View>

            <Text style={styles.subtitle}>
              {isSignup ? 'Sign up to book your ride' : 'Login to proceed with booking'}
            </Text>

            <View style={styles.form}>
              {/* Auth Method Toggle */}
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'email' && styles.activeMethodButton]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Text style={[styles.methodButtonText, authMethod === 'email' && styles.activeMethodButtonText]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'mobile' && styles.activeMethodButton]}
                  onPress={() => setAuthMethod('mobile')}
                >
                  <Text style={[styles.methodButtonText, authMethod === 'mobile' && styles.activeMethodButtonText]}>
                    Mobile
                  </Text>
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
                <View style={styles.mobileInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.mobileInput]}
                    placeholder="Mobile Number"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              )}

              {/* Signup Flow */}
              {isSignup && !otpSent && (
                <TouchableOpacity
                  style={[styles.authButton, loading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.authButtonText}>Send OTP</Text>
                  )}
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
                  <View style={styles.otpButtons}>
                    <TouchableOpacity
                      style={[
                        styles.otpButton,
                        otpVerified ? styles.verifiedButton : styles.pendingButton,
                        loading && styles.disabledButton
                      ]}
                      onPress={otpVerified ? undefined : handleVerifyOtp}
                      disabled={otpVerified || loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={[styles.authButtonText, !otpVerified && styles.pendingButtonText]}>
                          {otpVerified ? 'Verified ✓' : 'Verify OTP'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.otpButton,
                        canResend ? styles.authButton : styles.disabledButton,
                        loading && styles.disabledButton
                      ]}
                      onPress={canResend ? handleSendOtp : undefined}
                      disabled={!canResend || otpVerified || loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.authButtonText}>
                          {canResend ? 'Resend OTP' : `Resend (${resendTimer}s)`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

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
                        style={[
                          styles.authButton,
                          (!password || !confirmPassword || password !== confirmPassword || loading) && styles.disabledButton
                        ]}
                        onPress={handleSetPassword}
                        disabled={!password || !confirmPassword || password !== confirmPassword || loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.authButtonText}>Create Account</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* Login Flow */}
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
                    style={[styles.authButton, loading && styles.disabledButton]}
                    onPress={handleLogin}
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

              {/* <TouchableOpacity
                style={styles.guestButton}
                onPress={() => setGuestMode(true)}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  popup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -8,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeMethodButton: {
    backgroundColor: '#10B981',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeMethodButtonText: {
    color: '#ffffff',
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRightWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  mobileInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  authButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  otpButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  verifiedButton: {
    backgroundColor: '#22c55e',
  },
  pendingButton: {
    backgroundColor: '#fde047',
  },
  pendingButtonText: {
    color: '#374151',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  switchButtonText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  guestButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  guestButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});