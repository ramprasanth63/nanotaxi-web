// components/LocationInputModal.tsx
import { Location as LocationType } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LocationInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationType) => void;
  title: string;
  placeholder: string;
  initialValue?: string;
  suggestions: LocationType[];
  onSearchChange: (text: string) => void;
  loading?: boolean;
  iconName?: string;
  iconColor?: string;
}

const LocationInputModal: React.FC<LocationInputModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  title,
  placeholder,
  initialValue = '',
  suggestions,
  onSearchChange,
  loading = false,
  iconName = 'map-marker',
  iconColor = '#10B981',
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setSearchText(initialValue);
      // Auto-focus when modal opens with a small delay
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible, initialValue]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearchChange(text);
  };

  const handleSelectLocation = (location: LocationType) => {
    setSearchText(location.name);
    onSelectLocation(location);
    Keyboard.dismiss();
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleClear = () => {
    setSearchText('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons 
                name={iconName} 
                size={20} 
                color={iconColor} 
                style={styles.searchIcon} 
              />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearchChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}
          </View>

          {/* Suggestions */}
          <View style={styles.suggestionsContainer}>
            {!loading && suggestions.length === 0 && searchText.length > 2 && (
              <View style={styles.noResultsContainer}>
                <MaterialCommunityIcons name="map-search" size={48} color="#D1D5DB" />
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with a different keyword</Text>
              </View>
            )}

            {searchText.length === 0 && !loading && (
              <View style={styles.instructionContainer}>
                <MaterialCommunityIcons name="magnify" size={48} color="#D1D5DB" />
                <Text style={styles.instructionText}>Start typing to search</Text>
                <Text style={styles.instructionSubtext}>Enter location name, address, or landmark</Text>
              </View>
            )}

            <ScrollView 
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestionsContent}
            >
              {suggestions.map((location, index) => (
                <TouchableOpacity
                  key={`${location.id}-${index}`}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && styles.lastSuggestionItem
                  ]}
                  onPress={() => handleSelectLocation(location)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionIcon}>
                    <MaterialCommunityIcons 
                      name="map-marker-outline" 
                      size={20} 
                      color="#6B7280" 
                    />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {location.name}
                    </Text>
                    <Text style={styles.suggestionAddress} numberOfLines={2}>
                      {location.address}
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={20} 
                    color="#D1D5DB" 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Keyboard Spacer for iOS */}
          {Platform.OS === 'ios' && keyboardVisible && <View style={styles.keyboardSpacer} />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionsContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#ffffff',
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  keyboardSpacer: {
    height: 20,
  },
});

export default LocationInputModal;