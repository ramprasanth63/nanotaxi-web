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
}

const TaxiLoading: React.FC<TaxiLoadingProps> = ({
  visible = true,
  loadingText = 'Please wait...'
}) => {
  // Animation values
  const carAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const quoteIndex = useRef(0);
  const [currentQuote, setCurrentQuote] = React.useState('');

  // Inspiring quotes for taxi/travel service
  const quotes = [
    "Your journey begins with a single ride",
    "Every destination tells a story",
    "Comfort meets convenience on every trip",
    "Where you need to go, we'll take you there",
    "Making every mile memorable",
    "Your time is precious, we respect that",
    "Safe travels, comfortable rides",
    "Connecting you to your destination",
    "Quality service, reliable journeys",
    "Your comfort is our commitment"
  ];

  useEffect(() => {
    if (!visible) return;

    // Set initial quote
    setCurrentQuote(quotes[0]);

    // Car animation (moving horizontally)
    const carLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(carAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for the loading dots
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation for the outer circle
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Quote rotation
    const quoteInterval = setInterval(() => {
      quoteIndex.current = (quoteIndex.current + 1) % quotes.length;
      setCurrentQuote(quotes[quoteIndex.current]);
    }, 3000);

    // Start animations
    carLoop.start();
    pulseLoop.start();
    rotateLoop.start();

    return () => {
      carLoop.stop();
      pulseLoop.stop();
      rotateLoop.stop();
      clearInterval(quoteInterval);
    };
  }, [visible]);

  if (!visible) return null;

  const carTranslateX = carAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50],
  });

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation }]}>
      {/* Background overlay */}
      <View style={styles.overlay} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Rotating outer circle */}
        <Animated.View 
          style={[
            styles.outerCircle,
            {
              transform: [{ rotate: rotateInterpolate }]
            }
          ]}
        >
          {/* Dots around the circle */}
          <View style={[styles.dot, styles.dotTop]} />
          <View style={[styles.dot, styles.dotRight]} />
          <View style={[styles.dot, styles.dotBottom]} />
          <View style={[styles.dot, styles.dotLeft]} />
        </Animated.View>

        {/* Inner circle with car */}
        <View style={styles.innerCircle}>
          <Animated.View
            style={[
              styles.carContainer,
              {
                transform: [{ translateX: carTranslateX }]
              }
            ]}
          >
            <MaterialIcons name="directions-car" size={40} color="#2E8B57" />
          </Animated.View>
        </View>

        {/* Loading text with pulse animation */}
        <Animated.Text
          style={[
            styles.loadingText,
            {
              transform: [{ scale: pulseAnimation }]
            }
          ]}
        >
          {loadingText}
        </Animated.Text>

        {/* Quote section */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{currentQuote}"</Text>
        </View>

        {/* Loading dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: pulseAnimation }]} />
          <Animated.View style={[styles.loadingDot, { opacity: pulseAnimation }]} />
          <Animated.View style={[styles.loadingDot, { opacity: pulseAnimation }]} />
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  outerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#4169E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  carContainer: {
    padding: 10,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E8B57',
  },
  dotTop: {
    top: -4,
    left: '50%',
    marginLeft: -4,
  },
  dotRight: {
    right: -4,
    top: '50%',
    marginTop: -4,
  },
  dotBottom: {
    bottom: -4,
    left: '50%',
    marginLeft: -4,
  },
  dotLeft: {
    left: -4,
    top: '50%',
    marginTop: -4,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 30,
    textAlign: 'center',
  },
  quoteContainer: {
    marginTop: 25,
    paddingHorizontal: 40,
    maxWidth: width - 60,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#E8E8E8',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4169E1',
    marginHorizontal: 4,
  },
});

export default TaxiLoading;