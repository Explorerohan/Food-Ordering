import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchWithAutoRefresh } from '../services/api';
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';

const PaymentStatusScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderCreated = useRef(false);
  const [processing, setProcessing] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Extract params
  const { deliveryLocation, display_name, cartItems, tAmt, description } = route.params || {};

  useEffect(() => {
    const processPayment = async () => {
      if (orderCreated.current) return;
      orderCreated.current = true;
      setProcessing(true);
      try {
        const itemsPayload = cartItems.map(item => ({
          food_item: item.food_item.id,
          quantity: item.quantity,
          price: item.food_price || (item.size && item.size.price) || 0,
        }));
        // Create order
        const response = await fetchWithAutoRefresh(async (accessToken) => {
          return await fetch(getApiUrl(API_ENDPOINTS.ORDERS), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              description: description || 'Paid via eSewa',
              latitude: deliveryLocation?.latitude,
              longitude: deliveryLocation?.longitude,
              delivery_address: deliveryLocation?.display_name || display_name,
              total_amount: tAmt,
              items: itemsPayload,
            }),
          });
        });
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create order');
          setProcessing(false);
          return;
        }
        // Clear cart
        await fetchWithAutoRefresh(async (accessToken) => {
          return await fetch(getApiUrl(API_ENDPOINTS.CART_CLEAR), {
            method: 'DELETE',
            headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
          });
        });
        setProcessing(false);
        setShowSuccess(true);
      } catch (err) {
        setProcessing(false);
        setError('Failed to process payment. Please try again.');
      }
    };
    processPayment();
  }, []);

  if (processing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#60bb46" />
        <Text style={{ fontSize: 20, color: '#222', marginTop: 24, fontWeight: 'bold' }}>Processing Payment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Ionicons name="close-circle-outline" size={80} color="#F44336" style={{ marginBottom: 24 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F44336', marginBottom: 12, textAlign: 'center' }}>Payment Failed</Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center', maxWidth: 300 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#60bb46', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 }}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CartDetails' }] })}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Back to Cart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Ionicons name="checkmark-circle-outline" size={80} color="#60bb46" style={{ marginBottom: 24 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 12, textAlign: 'center' }}>Payment Completed Successfully!</Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center', maxWidth: 300 }}>
          Your payment and order have been processed. Thank you!
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#60bb46', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 }}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CartDetails' }] })}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

export default PaymentStatusScreen; 