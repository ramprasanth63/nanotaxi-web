import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
interface AuthPopupProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (customerId: string) => void;
  onGuestContinue: () => void;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  
  const { login } = useAuth();

  

useEffect(() => {
  const keyboardDidShow = (e: any) => {
    const keyboardHeight = e.endCoordinates.height;

    const currentlyFocusedField = TextInput.State.currentlyFocusedInput?.();
    const scrollHandle = findNodeHandle(scrollViewRef.current);
    const inputHandle = findNodeHandle(currentlyFocusedField);

    if (inputHandle && scrollHandle) {
      UIManager.measureLayout(
        inputHandle,
        scrollHandle,
        (error: any) => console.warn("measureLayout failed", error),
        (x: number, y: number, w: number, h: number) => {
          const screenHeight = Dimensions.get("window").height;
          const fieldBottom = y + h;
          const keyboardTop = screenHeight - keyboardHeight;

          if (fieldBottom > keyboardTop) {
            const scrollOffset = fieldBottom - keyboardTop + 20; // add padding
            scrollViewRef.current?.scrollTo({ y: scrollOffset, animated: true });
          }
        }
      );
    }
  };

  const keyboardDidHide = () => {
    // optional: reset scroll position if needed
  };

  const showSub = Keyboard.addListener("keyboardDidShow", keyboardDidShow);
  const hideSub = Keyboard.addListener("keyboardDidHide", keyboardDidHide);

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);



  // Simple show/hide animation
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight * 0.08, // Change from 0.1 to 0.08 (shows 92% of screen)
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Resend timer effect
  useEffect(() => {
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
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

// const scrollToInput = () => {

// };

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
        // scrollToInput();
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
        // scrollToInput();
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
        onLoginSuccess('');
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

  const renderPasswordInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    toggleShowPassword: () => void
  ) => (
    <View style={styles.passwordInputContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholderTextColor="#9CA3AF"
        // onFocus={scrollToInput}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={toggleShowPassword}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={showPassword ? 'eye' : 'eye-off'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />
        

          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
                marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
              }
            ]}
          >
            {/* Drag Handle */}

                   <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 20 }}
      enableOnAndroid={true}
      extraScrollHeight={20} // adds spacing above keyboard
    >
            <View style={styles.dragHandle}>
              <View style={styles.handleBar} />
            </View>
          
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.popup}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <Text style={styles.title}>
                      {isSignup ? 'Create Account' : 'Welcome Back'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {isSignup ? 'Sign up to book your ride' : 'Login to proceed with booking'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={handleClose} 
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  {/* Auth Method Toggle */}
                  <View style={styles.methodToggle}>
                    <TouchableOpacity
                      style={[
                        styles.methodButton, 
                        authMethod === 'email' && styles.activeMethodButton
                      ]}
                      onPress={() => setAuthMethod('email')}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name="email-outline" 
                        size={18} 
                        color={authMethod === 'email' ? '#ffffff' : '#6B7280'} 
                        style={styles.methodIcon}
                      />
                      <Text style={[
                        styles.methodButtonText, 
                        authMethod === 'email' && styles.activeMethodButtonText
                      ]}>
                        Email
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.methodButton, 
                        authMethod === 'mobile' && styles.activeMethodButton
                      ]}
                      onPress={() => setAuthMethod('mobile')}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name="phone-outline" 
                        size={18} 
                        color={authMethod === 'mobile' ? '#ffffff' : '#6B7280'} 
                        style={styles.methodIcon}
                      />
                      <Text style={[
                        styles.methodButtonText, 
                        authMethod === 'mobile' && styles.activeMethodButtonText
                      ]}>
                        Mobile
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Email or Mobile Input */}
                  {authMethod === 'email' ? (
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons 
                        name="email-outline" 
                        size={20} 
                        color="#6B7280" 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#9CA3AF"
                        // onFocus={scrollToInput}
                      />
                    </View>
                  ) : (
                    <View style={styles.mobileInputWrapper}>
                      <View style={styles.countryCode}>
                        <MaterialCommunityIcons name="phone" size={18} color="#6B7280" />
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.mobileInput}
                        placeholder="Enter mobile number"
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholderTextColor="#9CA3AF"
                        // onFocus={scrollToInput}
                      />
                    </View>
                  )}

                  {/* Signup Flow */}
                  {isSignup && !otpSent && (
                    <TouchableOpacity
                      style={[styles.primaryButton, loading && styles.disabledButton]}
                      onPress={handleSendOtp}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="send" size={18} color="#ffffff" style={styles.buttonIcon} />
                          <Text style={styles.primaryButtonText}>Send OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {isSignup && otpSent && (
                    <>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons 
                          name="shield-key-outline" 
                          size={20} 
                          color="#6B7280" 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!otpVerified}
                          placeholderTextColor="#9CA3AF"
                          // onFocus={scrollToInput}
                        />
                      </View>
                      
                      <View style={styles.otpButtons}>
                        <TouchableOpacity
                          style={[
                            styles.otpButton,
                            otpVerified ? styles.successButton : styles.warningButton,
                            loading && styles.disabledButton
                          ]}
                          onPress={otpVerified ? undefined : handleVerifyOtp}
                          disabled={otpVerified || loading}
                          activeOpacity={0.8}
                        >
                          {loading ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <>
                              <MaterialCommunityIcons 
                                name={otpVerified ? 'check-circle' : 'shield-check'} 
                                size={16} 
                                color="#ffffff" 
                                style={styles.buttonIcon}
                              />
                              <Text style={styles.otpButtonText}>
                                {otpVerified ? 'Verified' : 'Verify OTP'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.otpButton,
                            canResend ? styles.secondaryButton : styles.disabledButton,
                          ]}
                          onPress={canResend ? handleSendOtp : undefined}
                          disabled={!canResend || otpVerified || loading}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons 
                            name="refresh" 
                            size={16} 
                            color={canResend ? "#10B981" : "#9CA3AF"} 
                            style={styles.buttonIcon}
                          />
                          <Text style={[
                            styles.secondaryButtonText,
                            !canResend && styles.disabledButtonText
                          ]}>
                            {canResend ? 'Resend' : `${resendTimer}s`}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {otpVerified && (
                        <>
                          {renderPasswordInput(
                            password,
                            setPassword,
                            'Create password',
                            showPassword,
                            () => setShowPassword(!showPassword)
                          )}
                          
                          {renderPasswordInput(
                            confirmPassword,
                            setConfirmPassword,
                            'Confirm password',
                            showConfirmPassword,
                            () => setShowConfirmPassword(!showConfirmPassword)
                          )}
                          
                          <TouchableOpacity
                            style={[
                              styles.primaryButton,
                              (!password || !confirmPassword || password !== confirmPassword || loading) && styles.disabledButton
                            ]}
                            onPress={handleSetPassword}
                            disabled={!password || !confirmPassword || password !== confirmPassword || loading}
                            activeOpacity={0.8}
                          >
                            {loading ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <>
                                <MaterialCommunityIcons name="account-plus" size={18} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.primaryButtonText}>Create Account</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}

                  {/* Login Flow */}
                  {!isSignup && (
                    <>
                      {renderPasswordInput(
                        password,
                        setPassword,
                        'Enter your password',
                        showPassword,
                        () => setShowPassword(!showPassword)
                      )}
                      
                      <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="login" size={18} color="#ffffff" style={styles.buttonIcon} />
                            <Text style={styles.primaryButtonText}>Login</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Switch Button */}
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
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchButtonText}>
                      {isSignup
                        ? 'Already have an account? '
                        : "Don't have an account? "}
                      <Text style={styles.switchButtonHighlight}>
                        {isSignup ? 'Login' : 'Sign Up'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

               </KeyboardAwareScrollView>
          </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end', // Add this to push modal to bottom
  },
  overlayTouchable: {
    flex: 0.1, // Change from flex: 1 to flex: 0.1 (only 10% touchable area)
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    height: Dimensions.get("window").height * 0.92, // Change to 92% of screen height
    width: "100%",
    // Remove flex: 1 and maxHeight properties
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  popup: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeMethodButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  methodIcon: {
    marginRight: 4,
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeMethodButtonText: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
  },
  mobileInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    gap: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  mobileInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    paddingLeft: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  otpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  otpButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  otpButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#22C55E',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  buttonIcon: {
    marginRight: 4,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
  switchButtonHighlight: {
    color: '#10B981',
    fontWeight: '600',
  },
});