// components/HireDriverButton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Phone, Sparkles, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface HireDriverButtonProps {
  onPress?: () => void; // Function to navigate to hire driver screen
  style?: any;
}

const HireDriverButton: React.FC<HireDriverButtonProps> = ({ onPress, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animation
    Animated.loop(
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleCall = async () => {
    const phoneNumber = '8508706369';
    const url = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  };

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Glow Effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Sparkle Animation */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            transform: [{ rotate: sparkleRotate }],
          },
        ]}
      >
        <Sparkles size={16} color="#FEF3C7" style={styles.sparkle1} />
        <Sparkles size={12} color="#FEF3C7" style={styles.sparkle2} />
        <Sparkles size={14} color="#FEF3C7" style={styles.sparkle3} />
      </Animated.View>

      <View style={styles.buttonContainer}>
        {/* Main Button (85%) */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#059669', '#10B981', '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainGradient}
          >
            <View style={styles.mainContent}>
              <Users size={24} color="#FFFFFF" />
              <View style={styles.textContainer}>
                <Text style={styles.mainTitle}>Hire Professional Driver</Text>
                <Text style={styles.subtitle}>Premium • Verified • 24/7 Available</Text>
                <View style={styles.clickMoreContainer}>
                  <Text style={styles.clickMore}>Click to know more</Text>
                  <ArrowRight size={16} color="#D1FAE5" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Gap (2%) */}
        <View style={styles.gap} />

        {/* Call Button (13%) */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1E40AF', '#3B82F6', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.callGradient}
          >
            <Phone size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#10B981',
    borderRadius: 20,
    opacity: 0.3,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  sparkle2: {
    position: 'absolute',
    top: 20,
    left: 30,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 15,
    right: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    zIndex: 2,
  },
  mainButton: {
    flex: 0.85, // 85% width
    height: '100%',
  },
  mainGradient: {
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#D1FAE5',
    marginBottom: 4,
  },
  clickMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickMore: {
    fontSize: 12,
    color: '#D1FAE5',
    fontStyle: 'italic',
    marginRight: 4,
  },
  gap: {
    flex: 0.02, // 2% gap
  },
  callButton: {
    flex: 0.13, // 13% width
    height: '100%',
  },
  callGradient: {
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default HireDriverButton;

// ===============================================
// USAGE EXAMPLES:
// ===============================================

// 1. Basic usage - Navigate to hire driver screen
// import { useRouter } from 'expo-router';

// const router = useRouter();

// <HireDriverButton 
//   onPress={() => router.push('/hire-driver')} 
// />

// // 2. With custom styling
// <HireDriverButton 
//   onPress={() => router.push('/hire-driver')}
//   style={{ marginTop: 20 }}
// />

// // 3. In a ScrollView or list
// <ScrollView>
//   {/* Other content */}
  
//   <HireDriverButton 
//     onPress={() => router.push('/hire-driver')}
//   />
  
//   {/* More content */}
// </ScrollView>

// // 4. With navigation params
// <HireDriverButton 
//   onPress={() => router.push({
//     pathname: '/hire-driver',
//     params: { from: 'home' }
//   })}
// />

// ===============================================
// COMPONENT FEATURES:
// ===============================================

// ✨ Premium Animations:
// - Continuous pulse effect
// - Glowing border animation  
// - Rotating sparkle elements
// - Smooth press feedback

// 📱 Perfect Layout:
// - 85% main button (green gradient)
// - 2% gap between buttons
// - 13% call button (blue gradient)

// 🎨 Visual Effects:
// - Multi-layer gradients
// - Subtle shadows and elevation
// - Animated sparkle decorations
// - Professional typography

// 📞 Dual Functionality:
// - Main button: Navigate to hire driver screen
// - Call button: Direct phone call to 8508706369

// 💫 Premium Title:
// "Hire Professional Driver"
// "Premium • Verified • 24/7 Available"
// "Click to know more" with arrow

// 🚀 Technical Features:
// - TypeScript support
// - Responsive design
// - Cross-platform compatibility
// - Performance optimized animations