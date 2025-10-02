import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle,
  Clock,
  Heart,
  MapPin,
  Phone,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HireDriverScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showFixedCallButton, setShowFixedCallButton] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleCall = async () => {
    const phoneNumber = '8508706396';
    const url = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Phone call not supported");
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200; // Distance from bottom to hide button
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    setShowFixedCallButton(!isNearBottom);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Drivers',
      description: 'All our drivers are background-checked and licensed professionals',
      color: '#10B981',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock service for your convenience, any time of day',
      color: '#3B82F6',
    },
    {
      icon: Star,
      title: 'Premium Experience',
      description: 'Professional, courteous, and well-trained drivers for luxury travel',
      color: '#F59E0B',
    },
    {
      icon: MapPin,
      title: 'Local Expertise',
      description: 'Drivers with extensive knowledge of local routes and destinations',
      color: '#EF4444',
    },
    {
      icon: Users,
      title: 'Flexible Service',
      description: 'Perfect for business trips, family vacations, or special occasions',
      color: '#8B5CF6',
    },
    {
      icon: Award,
      title: 'Competitive Rates',
      description: 'Fair pricing with no hidden costs, transparent billing',
      color: '#06B6D4',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Animated Background Elements */}
      <Animated.View
        style={[
          styles.backgroundCircle1,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundCircle2,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header Section with Back Button */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#1F2937', '#374151', '#4B5563']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Animated.View style={styles.iconContainer}>
                <Users size={40} color="#10B981" />
              </Animated.View>
              <Text style={styles.headerTitle}>Get Active Drivers</Text>
              <Text style={styles.headerSubtitle}>
                Your journey, our expertise
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Travel in Comfort & Style
            </Text>
            <Text style={styles.heroDescription}>
              Experience premium transportation with our professional drivers. 
              Perfect for business trips, family vacations, special events, or 
              when you simply want to relax and enjoy the journey.
            </Text>
            
            {/* Proverb Section */}
            <View style={styles.proverbContainer}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.proverbText}>
                "A journey is best measured in friends, rather than miles." - Tim Cahill
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Benefits Grid */}
        <Animated.View
          style={[
            styles.benefitsSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Why Choose Our Service?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.benefitCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: Animated.add(
                          slideAnim,
                          new Animated.Value(index * 10)
                        ),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.benefitIcon, { backgroundColor: `${benefit.color}15` }]}>
                  <benefit.icon size={24} color={benefit.color} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Service Details */}
        <Animated.View
          style={[
            styles.serviceSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#F3F4F6', '#FFFFFF']}
            style={styles.serviceCard}
          >
            <Text style={styles.serviceTitle}>Perfect For:</Text>
            <View style={styles.serviceList}>
              {[
                'Business meetings and corporate events',
                'Airport transfers and long-distance travel',
                'Wedding ceremonies and special occasions',
                'Family trips and vacation adventures',
                'Medical appointments and elderly care',
                'Late-night events and party transportation',
              ].map((item, index) => (
                <View key={index} style={styles.serviceItem}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.serviceItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Additional Proverb */}
        <Animated.View
          style={[
            styles.inspirationSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.inspirationGradient}
          >
            <Zap size={24} color="#FFFFFF" />
            <Text style={styles.inspirationText}>
              "The journey not the arrival matters." - T.S. Eliot
            </Text>
            <Text style={styles.inspirationSubtext}>
              Let us make your journey memorable and stress-free
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View
          style={[
            styles.contactSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            style={styles.contactGradient}
          >
            <Text style={styles.contactTitle}>Ready to Book?</Text>
            <Text style={styles.contactDescription}>
              For pricing details, availability, and booking,{'\n'}
              contact us directly
            </Text>
            
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.phoneButtonGradient}
              >
                <Phone size={24} color="#059669" />
                <Text style={styles.phoneNumber}>8508706396</Text>
                <ArrowRight size={20} color="#059669" />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.contactNote}>
              Available 24/7 • Instant Response • Professional Service
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Experience the difference of professional driving service
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Call Button */}
      {showFixedCallButton && (
        <Animated.View
          style={[
            styles.fixedCallButton,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fixedCallTouchable}
            onPress={handleCall}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              style={styles.fixedCallGradient}
            >
              <Phone size={20} color="#FFFFFF" />
              <Text style={styles.fixedCallText}>8508706396</Text>
              <Text style={styles.fixedCallSubtext}>Tap to call</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#10B98110',
    zIndex: -1,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#3B82F610',
    zIndex: -1,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF20',
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF20',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  heroContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  proverbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  proverbText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7F1D1D',
    marginLeft: 8,
    flex: 1,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  serviceSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  serviceCard: {
    borderRadius: 20,
    padding: 24,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  serviceList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
  inspirationSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inspirationGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  inspirationText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 12,
  },
  inspirationSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  contactGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 16,
    color: '#D1FAE5',
    textAlign: 'center',
    marginBottom: 24,
  },
  phoneButton: {
    marginBottom: 16,
  },
  phoneButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginHorizontal: 12,
  },
  contactNote: {
    fontSize: 12,
    color: '#A7F3D0',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fixedCallButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  fixedCallTouchable: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fixedCallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  fixedCallText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
    marginRight: 8,
  },
  fixedCallSubtext: {
    fontSize: 12,
    color: '#D1FAE5',
    fontStyle: 'italic',
  },
});

export default HireDriverScreen;