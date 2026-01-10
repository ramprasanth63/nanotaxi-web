import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext'; 
import { apiGet, apiPut } from '@/services/apiClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { lang } = useLanguage(); // Get current language
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    if (isLoggedIn && user?.customer_id) {
      fetchCustomerDetails();
    }
  }, [user]);
  
  const fetchCustomerDetails = async () => {
    try {
      const response = await apiGet(`/api/get_customer/${user?.customer_id}/`);
      if (response.status === 200) {
        console.log("Customer details fetched:", response.data.customer);
        setCustomerData(response.data.customer);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailInput.trim()) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Please enter a valid email address' : 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Please enter a valid email format' : 'சரியான மின்னஞ்சல் வடிவத்தை உள்ளிடவும்'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPut(`/api/edit_customer/${user?.customer_id}/`, {
        email: emailInput,
      });

      if (response.status === 200 || response.ok) {
        await fetchCustomerDetails();
        setShowEmailModal(false);
        setEmailInput('');
        Alert.alert(
          lang === 'en' ? 'Success' : 'வெற்றி',
          lang === 'en' ? 'Email updated successfully!' : 'மின்னஞ்சல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
        );
      }
    } catch (error) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Failed to update email. Please try again.' : 'மின்னஞ்சலை புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!phoneInput.trim()) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Please enter a valid phone number' : 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்'
      );
      return;
    }

    let formattedPhone = phoneInput.trim();
    if (!formattedPhone.startsWith('+91')) {
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }

    if (formattedPhone.length !== 13) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Please enter a valid 10-digit phone number' : 'சரியான 10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPut(`/api/edit_customer/${user?.customer_id}/`, {
        phone_number: formattedPhone,
      });

      if (response.status === 200 || response.ok) {
        await fetchCustomerDetails();
        setShowPhoneModal(false);
        setPhoneInput('');
        Alert.alert(
          lang === 'en' ? 'Success' : 'வெற்றி',
          lang === 'en' ? 'Phone number updated successfully!' : 'தொலைபேசி எண் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
        );
      }
    } catch (error) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'பிழை',
        lang === 'en' ? 'Failed to update phone number. Please try again.' : 'தொலைபேசி எண்ணை புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Logout failed', err);
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSupportCall = () => {
    Alert.alert(
      lang === 'en' ? 'Call Support' : 'ஆதரவை தொடர்பு கொள்ள',
      lang === 'en' 
        ? 'Call our support team at +91 9840407707?' 
        : 'எங்கள் ஆதரவு குழுவை +91 9840407707 இல் தொடர்பு கொள்ளவா?',
      [
        { 
          text: lang === 'en' ? 'Cancel' : 'ரத்து', 
          style: 'cancel' 
        },
        { 
          text: lang === 'en' ? 'Call' : 'அழைக்க', 
          onPress: () => Linking.openURL('tel:+919840407707') 
        },
      ]
    );
  };

  const getEmailValue = () => {
    if (!isLoggedIn) return lang === 'en' ? 'Not logged in' : 'உள்நுழையவில்லை';
    
    if (customerData?.email) return customerData.email;
    if (customerData?.contact && !customerData.contact.startsWith('+91')) {
      return customerData.contact;
    }
    return null;
  };

  const getPhoneValue = () => {
    if (!isLoggedIn) return lang === 'en' ? 'Not logged in' : 'உள்நுழையவில்லை';
    
    if (customerData?.phone_number) return customerData.phone_number;
    if (customerData?.contact && customerData.contact.startsWith('+91')) {
      return customerData.contact;
    }
    return null;
  };

  const profileSections = [
    {
      title: lang === 'en' ? 'Account Information' : 'கணக்கு தகவல்',
      items: [
        {
          icon: <MaterialCommunityIcons name="email-outline" size={24} color="#1FC25B" />,
          label: lang === 'en' ? 'Email' : 'மின்னஞ்சல்',
          value: getEmailValue(),
          onPress: () => {
            if (isLoggedIn) {
              setEmailInput(getEmailValue() || '');
              setShowEmailModal(true);
            }
          },
          showAdd: isLoggedIn && !getEmailValue(),
        },
        {
          icon: <MaterialCommunityIcons name="phone-outline" size={24} color="#FACC14" />,
          label: lang === 'en' ? 'Phone' : 'தொலைபேசி',
          value: getPhoneValue(),
          onPress: () => {
            if (isLoggedIn) {
              setPhoneInput(getPhoneValue()?.replace('+91', '') || '');
              setShowPhoneModal(true);
            }
          },
          showAdd: isLoggedIn && !getPhoneValue(),
        },
      ],
    },
    {
      title: lang === 'en' ? 'Support & Help' : 'ஆதரவு மற்றும் உதவி',
      items: [
        {
          icon: <MaterialCommunityIcons name="headset" size={24} color="#1FC25B" />,
          label: lang === 'en' ? 'Customer Support' : 'வாடிக்கையாளர் ஆதரவு',
          value: '+91 9840407707',
          onPress: handleSupportCall,
          showAdd: false,
        },
      ],
    },
  ];

  const renderProfileItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.profileItem, index === 0 && styles.profileItemFirst]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          {item.icon}
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          {item.showAdd ? (
            <View style={styles.addContainer}>
              <MaterialCommunityIcons name="plus-circle" size={16} color="#1FC25B" />
              <Text style={styles.addText}>
                {lang === 'en' ? `Tap to add ${item.label.toLowerCase()}` : `சேர்க்க கிளிக் செய்யவும்`}
              </Text>
            </View>
          ) : (
            <Text style={styles.itemValue} numberOfLines={1}>{item.value}</Text>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    value: string,
    onChangeText: (text: string) => void,
    onSubmit: () => void,
    placeholder: string,
    keyboardType: any = 'default'
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isLoading 
                ? (lang === 'en' ? 'Updating...' : 'புதுப்பிக்கிறது...') 
                : (lang === 'en' ? 'Submit' : 'சமர்ப்பிக்கவும்')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === 'en' ? 'Profile' : 'சுயவிவரம்'}
        </Text>
        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
            <MaterialCommunityIcons name="logout-variant" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={48} color="#1FC25B" />
            <View style={styles.avatarBadge}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#FACC14" />
            </View>
          </View>
          <Text style={styles.userName}>
            {isLoggedIn 
              ? (customerData?.contact || user?.username || (lang === 'en' ? 'User' : 'பயனர்')) 
              : (lang === 'en' ? 'Guest User' : 'விருந்தினர் பயனர்')
            }
          </Text>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons 
              name={isLoggedIn ? "check-circle" : "account-off"} 
              size={14} 
              color={isLoggedIn ? "#1FC25B" : "#9CA3AF"} 
            />
            <Text style={[styles.statusText, isLoggedIn && styles.statusTextActive]}>
              {isLoggedIn 
                ? (lang === 'en' ? 'Active Account' : 'செயலில் உள்ள கணக்கு')
                : (lang === 'en' ? 'Not logged in' : 'உள்நுழையவில்லை')
              }
            </Text>
          </View>
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="login" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>
                {lang === 'en' ? 'Login to Continue' : 'தொடர உள்நுழையவும்'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderProfileItem)}
            </View>
          </View>
        ))}

        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="car" size={32} color="#1FC25B" />
          </View>
          <Text style={styles.appTitle}>NANO Taxi</Text>
          <Text style={styles.appDescription}>
            {lang === 'en' 
              ? 'Your reliable ride booking companion' 
              : 'உங்கள் நம்பகமான பயண பதிவு துணை'
            }
          </Text>
          <View style={styles.appBadges}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#1FC25B" />
              <Text style={styles.badgeText}>
                {lang === 'en' ? 'Secure' : 'பாதுகாப்பானது'}
              </Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="clock-fast" size={14} color="#FACC14" />
              <Text style={styles.badgeText}>
                {lang === 'en' ? 'Fast' : 'வேகமானது'}
              </Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star" size={14} color="#FACC14" />
              <Text style={styles.badgeText}>
                {lang === 'en' ? 'Reliable' : 'நம்பகமானது'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderModal(
        showEmailModal,
        () => setShowEmailModal(false),
        lang === 'en' ? 'Update Email' : 'மின்னஞ்சலை புதுப்பிக்கவும்',
        emailInput,
        setEmailInput,
        handleUpdateEmail,
        lang === 'en' ? 'Enter your email address' : 'உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்',
        'email-address'
      )}

      {renderModal(
        showPhoneModal,
        () => setShowPhoneModal(false),
        lang === 'en' ? 'Update Phone Number' : 'தொலைபேசி எண்ணை புதுப்பிக்கவும்',
        phoneInput,
        setPhoneInput,
        handleUpdatePhone,
        lang === 'en' ? 'Enter 10-digit phone number' : '10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்',
        'phone-pad'
      )}

      {/* Custom Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalTitle}>
              {lang === 'en' ? 'Confirm Logout' : 'வெளியேற உறுதிப்படுத்தவும்'}
            </Text>
            <Text style={styles.logoutModalText}>
              {lang === 'en' 
                ? 'Are you sure you want to logout?' 
                : 'நீங்கள் வெளியேற விரும்புகிறீர்களா?'
              }
            </Text>

            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={[styles.logoutCancelButton]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutCancelButtonText}>
                  {lang === 'en' ? 'Cancel' : 'ரத்து'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutButton, isLoggingOut && { opacity: 0.6 }]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutButtonText}>
                  {isLoggingOut 
                    ? (lang === 'en' ? 'Logging out...' : 'வெளியேறுகிறது...') 
                    : (lang === 'en' ? 'Logout' : 'வெளியேறு')
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#1FC25B',
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F0FDF4',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#1FC25B',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#1FC25B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1FC25B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 24,
    marginBottom: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    fontSize: 14,
    color: '#1FC25B',
    marginLeft: 6,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1FC25B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1FC25B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1FC25B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  appBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '600',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoutModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  logoutModalText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
  },
  logoutButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoutCancelButton: {
    width: '48%',
    backgroundColor: '#1FC25B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButton: {
    width: '48%',
    backgroundColor: '#FACC14',
    opacity: 0.6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutIconButton: {
    width: '15%',
    backgroundColor: '#FACC14',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});