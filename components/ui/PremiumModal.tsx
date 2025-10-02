import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectHourly?: () => void;
  title?: string;
  description?: string;
  infoText?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
  onSelectHourly,
  title = 'Service Under Development',
  description = "We're working hard to bring you services below 100 KM!",
  infoText = 'Meanwhile, try our flexible Hourly Packages for trips under 100 KM',
  primaryButtonText = 'Hourly Package →',
  secondaryButtonText = 'Choose Other',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalContainer}>
            {/* Decorative gradient header */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientHeader}
            />

            <View style={styles.contentContainer}>
              {/* Icon with animated background */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="road-variant" size={40} color="#10B981" />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Description */}
              <Text style={styles.description}>{description}</Text>

              {/* Info box */}
              <View style={styles.infoBox}>
                <View style={styles.infoContent}>
                  <MaterialCommunityIcons name="lightbulb-on" size={20} color="#059669" />
                  <Text style={styles.infoText}>{infoText}</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    onClose();
                    onSelectHourly?.();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 24,
  },
  gradientHeader: {
    height: 6,
    width: '100%',
  },
  contentContainer: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    width: '100%',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PremiumModal;

// USAGE EXAMPLE:
/*
import PremiumModal from './components/PremiumModal';

function YourScreen() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text>Show Modal</Text>
      </TouchableOpacity>

      <PremiumModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelectHourly={() => {
          // Handle hourly package selection
          setBookingMode('hourly');
        }}
      />
    </>
  );
}

// Custom text example:
<PremiumModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSelectHourly={() => console.log('Hourly selected')}
  title="Custom Title"
  description="Custom description text"
  infoText="Custom info message"
  primaryButtonText="Select Package"
  secondaryButtonText="Cancel"
/>
*/