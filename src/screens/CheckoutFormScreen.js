import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CheckoutFormScreen = ({ route, navigation }) => {
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [description, setDescription] = useState('');
  const cartItems = route.params?.cartItems || [];

  // Handle location picked from MapScreen
  React.useEffect(() => {
    if (route.params && route.params.selectedLocation) {
      setDeliveryLocation(route.params.selectedLocation);
    }
    // Always preserve cartItems in params
    if (route.params && route.params.cartItems) {
      // No-op, just ensures cartItems is always present
    }
  }, [route.params]);

  const handlePickLocation = () => {
    navigation.navigate('MapScreen', { fromCheckout: true, cartItems });
  };

  const handleContinue = () => {
    // Pass data to next step (order confirmation or API call)
    navigation.navigate('OrderConfirmationScreen', {
      deliveryLocation,
      description,
      display_name: deliveryLocation?.display_name,
      cartItems,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Details</Text>
      <TouchableOpacity style={styles.mapBtn} onPress={handlePickLocation}>
        <Ionicons name="location-outline" size={22} color="#FF6B35" />
        <Text style={styles.mapBtnText}>
          {deliveryLocation
            ? (deliveryLocation.display_name || `Location Selected: (${deliveryLocation.latitude.toFixed(5)}, ${deliveryLocation.longitude.toFixed(5)})`)
            : 'Pick Delivery Location on Map'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>Order Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Add any extra instructions for your order..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity
        style={[styles.continueBtn, !(deliveryLocation && description.trim()) && styles.disabledBtn]}
        onPress={handleContinue}
        disabled={!(deliveryLocation && description.trim())}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  mapBtnText: {
    marginLeft: 12,
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 24,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  continueBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
});

export default CheckoutFormScreen; 