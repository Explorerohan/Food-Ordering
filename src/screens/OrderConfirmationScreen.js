import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to refresh access token
const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const response = await fetch('http://192.168.254.5:8000/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem('accessToken', data.access);
      return data.access;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

const OrderConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryLocation, description, display_name } = route.params || {};
  const { item: propItem, selectedSize: propSelectedSize, selectedSpice: propSelectedSpice, onClose, isModal } = route.params || {};
  const item = propItem || (route && route.params && route.params.item);
  const selectedSize = propSelectedSize || (route && route.params && route.params.selectedSize);
  const selectedSpice = propSelectedSpice || (route && route.params && route.params.selectedSpice);
  const [quantity, setQuantity] = useState(1);
  const sizeObj = item && item.sizes ? item.sizes.find(s => s.size === selectedSize) : null;
  const price = sizeObj ? sizeObj.price : (item ? item.price : 0);
  const total = price * quantity;
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      let token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Auth Error', 'No access token found. Please log in again.');
        setCartItems([]);
        setTotalAmount(0);
        return;
      }
      let response = await fetch('http://192.168.254.5:8000/api/cart/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      let data = await response.json();
      // Handle expired token
      if (data.code === 'token_not_valid') {
        token = await refreshAccessToken();
        if (token) {
          response = await fetch('http://192.168.254.5:8000/api/cart/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          data = await response.json();
        } else {
          Alert.alert('Session Expired', 'Please log in again.');
          navigation.navigate('LoginScreen');
          setCartItems([]);
          setTotalAmount(0);
          return;
        }
      }
      const items = data.items || data.cart_items || data || [];
      setCartItems(items);
      calculateTotal(items);
    } catch (error) {
      setCartItems([]);
      setTotalAmount(0);
      console.error('Error fetching cart items:', error);
      Alert.alert('Cart Error', 'Failed to fetch cart items. Please check your connection or login status.');
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      // Use food_price or price, and parse as float
      const price = parseFloat(item.food_price || item.price || 0);
      const quantity = parseInt(item.quantity || 0, 10);
      // If price or quantity is NaN, treat as 0
      const safePrice = isNaN(price) ? 0 : price;
      const safeQuantity = isNaN(quantity) ? 0 : quantity;
      return sum + (safePrice * safeQuantity);
    }, 0);
    setTotalAmount(total);
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        delivery_address: display_name || `${deliveryLocation.latitude}, ${deliveryLocation.longitude}`,
        delivery_latitude: deliveryLocation.latitude,
        delivery_longitude: deliveryLocation.longitude,
        description: description,
        items: cartItems.map(item => ({
          food_item: item.food_item?.id || item.food_item || item.id,
          quantity: item.quantity,
          price: item.food_price || item.price || 0
        })),
        total_amount: totalAmount,
      };

      let token = await AsyncStorage.getItem('accessToken');
      let response = await fetch('http://192.168.254.5:8000/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      // If unauthorized, try refreshing the token and retry
      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          response = await fetch('http://192.168.254.5:8000/api/orders/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
          });
        } else {
          Alert.alert('Session Expired', 'Please log in again.');
          navigation.navigate('LoginScreen');
          return;
        }
      }

      if (response.ok) {
        // Clear the cart after successful order
        try {
          const clearToken = token || await AsyncStorage.getItem('accessToken');
          await fetch('http://192.168.254.5:8000/api/cart/clear/', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${clearToken}`,
            },
          });
        } catch (clearErr) {
          console.error('Error clearing cart after order:', clearErr);
        }
        Alert.alert('Success', 'Order placed successfully!');
        navigation.popToTop();
      } else {
        const errorText = await response.text();
        console.error('Order placement error:', response.status, errorText);
        Alert.alert('Error', `Failed to place order. Server says: ${errorText}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  // Calculate header padding for status bar
  const headerPaddingTop = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

  return (
    <SafeAreaView style={[styles.safeArea, isModal && { paddingTop: 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        {isModal ? (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Summary</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
        {/* Delivery Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Delivery Details</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.label}>Delivery Address:</Text>
            <Text style={styles.value}>{display_name || 'Address not available'}</Text>
            <Text style={styles.label}>Special Instructions:</Text>
            <Text style={styles.value}>{description || 'No special instructions'}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyCartText}>No items in your cart.</Text>
          ) : (
            <View>
              {cartItems.map((item, idx) => (
                <View key={idx} style={styles.cartItemCard}>
                  <Image
                    source={{ uri: item.food_item.image }}
                    style={styles.cartItemImage}
                  />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.food_item.name}</Text>
                    <Text style={styles.cartItemDetails}>
                      Size: <Text style={{fontWeight:'500'}}>{item.size.size}</Text>  |  Qty: <Text style={{fontWeight:'500'}}>{item.quantity}</Text>
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      ₹{item.food_price} each
                    </Text>
                    <Text style={styles.cartItemTotal}>
                      Total: ₹{item.total_price}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, cartItems.length === 0 && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={cartItems.length === 0}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.placeOrderBtnText}>Place Order</Text>
        </TouchableOpacity>
        {cartItems.length === 0 && (
          <Text style={styles.emptyCartWarning}>You cannot place an order with an empty cart.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    alignItems: 'stretch',
  },
  image: { width: 120, height: 120, borderRadius: 12, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  detail: { fontSize: 16, color: '#555', marginBottom: 4 },
  detailValue: { color: '#222', fontWeight: '600' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  qtyBtn: { padding: 8, backgroundColor: '#f2f2f2', borderRadius: 6 },
  qtyValue: { fontSize: 18, fontWeight: '600', marginHorizontal: 12 },
  total: { fontSize: 18, fontWeight: '700', color: '#FF6B35', marginVertical: 12 },
  confirmBtn: { backgroundColor: '#FF6B35', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8, marginTop: 16 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  deliveryInfo: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  emptyCartText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  emptyCartWarning: {
    color: '#FF6B35',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  cartItemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#FF6B35',
    marginBottom: 2,
  },
  cartItemTotal: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default OrderConfirmationScreen; 