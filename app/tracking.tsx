import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function BookingConfirmationScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  
  // Floating circles animation
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale in checkmark
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide up content
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Ripple effects
    const rippleAnimation1 = Animated.loop(
      Animated.timing(rippleAnim1, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    const rippleAnimation2 = Animated.loop(
      Animated.timing(rippleAnim2, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    setTimeout(() => {
      rippleAnimation1.start();
    }, 600);

    setTimeout(() => {
      rippleAnimation2.start();
    }, 1100);

    // Pulse animation for button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    setTimeout(() => {
      pulseAnimation.start();
    }, 1500);

    // Floating circles animation
    const floatingAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Anim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(circle2Anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(circle3Anim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(circle3Anim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    );

    floatingAnimation1.start();
    setTimeout(() => floatingAnimation2.start(), 1000);
    setTimeout(() => floatingAnimation3.start(), 2000);

    return () => {
      pulseAnimation.stop();
      rippleAnimation1.stop();
      rippleAnimation2.stop();
      floatingAnimation1.stop();
      floatingAnimation2.stop();
      floatingAnimation3.stop();
    };
  }, []);

  const handleNavigateToMyRides = () => {
    // Haptic feedback would go here if available
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    router.push('/(tabs)/bookings');
  };

  const handleStayOnPage = () => {
    Alert.alert(
      'Staying Here',
      'You can check My Rides anytime from the tab bar!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const rippleScale1 = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const rippleOpacity1 = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const rippleScale2 = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const rippleOpacity2 = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0],
  });

  const circle1Y = circle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const circle2Y = circle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const circle3Y = circle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Floating Background Elements */}
      <Animated.View style={[styles.backgroundElements, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.circle,
            styles.circle1,
            { transform: [{ translateY: circle1Y }] }
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            styles.circle2,
            { transform: [{ translateY: circle2Y }] }
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            styles.circle3,
            { transform: [{ translateY: circle3Y }] }
          ]}
        />
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.contentCard}>
          {/* Success Checkmark */}
          <Animated.View style={[styles.checkmarkContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.checkmarkCircle}>
              <MaterialCommunityIcons name="check" size={40} color="#ffffff" />
            </View>
            
            {/* Ripple Effects */}
            <Animated.View
              style={[
                styles.ripple,
                {
                  transform: [{ scale: rippleScale1 }],
                  opacity: rippleOpacity1,
                }
              ]}
            />
            <Animated.View
              style={[
                styles.ripple,
                {
                  transform: [{ scale: rippleScale2 }],
                  opacity: rippleOpacity2,
                }
              ]}
            />
          </Animated.View>

          {/* Main Title */}
          <Text style={styles.mainTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.subtitle}>Your ride has been successfully booked</Text>

          {/* Message Container */}
          <View style={styles.messageContainer}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.messageText}>
              We'll send you driver details soon{'\n'}Please check the "My Rides" section for updates
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
              <Text style={styles.featureText}>Real-time tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="phone" size={20} color="#10B981" />
              <Text style={styles.featureText}>Direct driver contact</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="star" size={20} color="#10B981" />
              <Text style={styles.featureText}>Rate your experience</Text>
            </View>
          </View>

          {/* Action Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleNavigateToMyRides}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="map-marker" size={24} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Go to My Rides</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Action */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleStayOnPage}>
            <Text style={styles.secondaryButtonText}>Stay on this page</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#10B981',
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#3B82F6',
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#8B5CF6',
    top: '40%',
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  checkmarkContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    alignSelf: 'stretch',
  },
  iconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: '#059669',
    lineHeight: 22,
    fontWeight: '500',
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
    minWidth: 220,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
    flex: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});