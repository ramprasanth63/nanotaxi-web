import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface TaxiLoadingProps {
  visible?: boolean;
  loadingText?: string;
  backgroundColor?: string;
}

const TaxiLoading: React.FC<TaxiLoadingProps> = ({
  visible = true,
  loadingText = 'Please wait...',
  backgroundColor = '#FFFFFF'
}) => {
  // Animation values
  const carShakeX = useRef(new Animated.Value(0)).current;
  const carShakeY = useRef(new Animated.Value(0)).current;
  const circleRotation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const shineAnimation = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const quoteIndex = useRef(0);
  const [currentQuote, setCurrentQuote] = React.useState('');

  // Professional quotes for taxi/transport service
  const quotes = [
    "Your journey begins with a single ride",
    "Connecting you to your destination",
    "Safe travels, comfortable rides",
    "Quality service, reliable journeys",
    "Where you need to go, we'll take you there"
  ];

  useEffect(() => {
    if (!visible) return;

    // Set initial quote
    setCurrentQuote(quotes[0]);

    // Car shake animation (like engine vibration)
    const carShakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carShakeX, {
          toValue: 2,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(carShakeX, {
          toValue: -2,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(carShakeX, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    const carShakeYLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carShakeY, {
          toValue: 1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(carShakeY, {
          toValue: -1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(carShakeY, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Circle rotation animation
    const circleRotationLoop = Animated.loop(
      Animated.timing(circleRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Progress bar animation
    const progressLoop = Animated.loop(
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false, // Cannot use native driver for width
      })
    );

    // Shine animation for brand name
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(1500), // Pause between shine effects
      ])
    );

    // Dots loading animation (sequential)
    const createDotAnimation = () => {
      const animations = dotsAnimation.map((dot, index) => 
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      
      return Animated.loop(
        Animated.sequence([
          Animated.parallel(animations),
          Animated.delay(400),
        ])
      );
    };

    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Quote rotation
    const quoteInterval = setInterval(() => {
      quoteIndex.current = (quoteIndex.current + 1) % quotes.length;
      setCurrentQuote(quotes[quoteIndex.current]);
    }, 4000);

    // Start animations
    carShakeLoop.start();
    carShakeYLoop.start();
    circleRotationLoop.start();
    progressLoop.start();
    shineLoop.start();
    createDotAnimation().start();

    return () => {
      carShakeLoop.stop();
      carShakeYLoop.stop();
      circleRotationLoop.stop();
      progressLoop.stop();
      shineLoop.stop();
      dotsAnimation.forEach(dot => dot.stopAnimation());
      clearInterval(quoteInterval);
    };
  }, [visible]);

  if (!visible) return null;

  const circleRotationInterpolate = circleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shinePosition = shineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation, backgroundColor }]}>
      {/* Main content */}
      <View style={styles.content}>
        {/* Brand Name with Shine Effect */}
        <View style={styles.brandContainer}>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandText}>NANO</Text>
            <Text style={styles.brandSubText}>Taxi</Text>
            <Animated.View
              style={[
                styles.shine,
                {
                  transform: [{ translateX: shinePosition }]
                }
              ]}
            />
          </View>
        </View>
        {/* Loading circle with taxi icon */}
        <View style={styles.loadingContainer}>
          {/* Rotating outer ring */}
          <Animated.View 
            style={[
              styles.outerRing,
              {
                transform: [{ rotate: circleRotationInterpolate }]
              }
            ]}
          />
          
          {/* Static inner circle with car */}
          <View style={styles.innerCircle}>
            <Animated.View
              style={{
                transform: [
                  { translateX: carShakeX },
                  { translateY: carShakeY }
                ]
              }}
            >
              <MaterialIcons name="local-taxi" size={36} color="#FFB800" />
            </Animated.View>
          </View>
        </View>

        {/* Loading text */}
        <Text style={styles.loadingText}>
          {loadingText}
        </Text>

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          {dotsAnimation.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: dot,
                  transform: [{
                    scale: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]}
            />
          ))}
        </View>

        {/* Quote section */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{currentQuote}"</Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressWidth
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  brandContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  brandTextContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFB800',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: -2,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
    width: 30,
  },
  loadingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#4CAF50',
    borderRightColor: '#2196F3',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 32,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  quoteContainer: {
    marginTop: 24,
    paddingHorizontal: 40,
    maxWidth: width - 80,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 32,
    width: width - 100,
    maxWidth: 280,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});

export default TaxiLoading;