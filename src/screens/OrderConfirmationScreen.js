import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Alert, Modal, Animated, Easing, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';
import notificationService from '../services/notificationService';

// Helper function to refresh access token
const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
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

const paymentOptions = [
  { key: 'esewa', label: 'Esewa', logoUrl: 'https://media.licdn.com/dms/image/sync/v2/D4D27AQG8vY0HJvndiA/articleshare-shrink_800/articleshare-shrink_800/0/1734856652596?e=2147483647&v=beta&t=Bv2nRIjUfQqm01SIrVrfe4kBIeZLA-FAAf4RgwbKpMg' },
  { key: 'khalti', label: 'Khalti', logoUrl: 'https://www.pikpng.com/pngl/m/292-2923069_khalti-digital-wallet-logo-khalti-clipart.png' },
  { key: 'cod', label: 'Cash on Delivery', logoUrl: 'https://cdn-icons-png.freepik.com/256/1981/1981845.png?semt=ais_hybrid' },
  { key: 'fonepay', label: 'Fonepay', logoUrl: 'https://superdesk-pro-c.s3.amazonaws.com/sd-nepalitimes/20221110161156/636d1f849c7e80680e0af46bpng.png' },
];

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [selectedPayment, setSelectedPayment] = useState(null);

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
      let response = await fetch(getApiUrl(API_ENDPOINTS.CART), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      let data = await response.json();
      // Handle expired token
      if (data.code === 'token_not_valid') {
        token = await refreshAccessToken();
        if (token) {
          response = await fetch(getApiUrl(API_ENDPOINTS.CART), {
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

  const openPaymentModal = () => {
    setShowPaymentModal(true);
    slideAnim.setValue(400);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closePaymentModal = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setShowPaymentModal(false));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          closePaymentModal();
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleNext = async () => {
    if (selectedPayment === 'esewa') {
      // Generate a unique transaction ID
      const transactionId = `SPICEBITE_${Date.now()}`;
      
      // Calculate amounts
      const tAmt = totalAmount; // Total Amount
      const amt = totalAmount; // Product Amount (actual cost)
      const txAmt = 0; // Tax Amount
      const psc = 0; // Service Charge
      const pdc = 0; // Delivery Charge
      
      navigation.navigate('EsewaPaymentScreen', {
        tAmt,
        amt,
        txAmt,
        psc,
        pdc,
        pid: transactionId,
        deliveryLocation,
        description,
        display_name: deliveryLocation?.display_name || display_name,
        cartItems,
      });
    } else if (selectedPayment === 'cod') {
      // Handle cash on delivery - navigate to PaymentStatusScreen
      navigation.navigate('PaymentStatusScreen', {
        deliveryLocation,
        display_name: deliveryLocation?.display_name || display_name,
        cartItems,
        tAmt: totalAmount,
        description: description || 'Cash on Delivery',
        isCod: true, // Flag to indicate this is COD order
      });
    } else {
      // Handle other payment methods
      Alert.alert('Payment Method', 'This payment method is not available yet.');
    }
  };

  return (
    <SafeAreaViewContext style={[styles.safeArea, isModal && { paddingTop: 0 }]} edges={["top","left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
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
          onPress={openPaymentModal}
          disabled={cartItems.length === 0}
        >
          <Ionicons name="card-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.placeOrderBtnText}>Select Payment Method</Text>
        </TouchableOpacity>
        {cartItems.length === 0 && (
          <Text style={styles.emptyCartWarning}>You cannot proceed with an empty cart.</Text>
        )}
      </View>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={closePaymentModal}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenSheet}>
            <View style={styles.paymentHeaderRow}>
              <TouchableOpacity onPress={closePaymentModal} style={styles.paymentBackBtn}>
                <Ionicons name="arrow-back" size={26} color="#222" />
              </TouchableOpacity>
              <Text style={styles.paymentScreenTitle}>Payments</Text>
            </View>
            <Text style={styles.paymentSubtitle}>Choose the payment method you'd like to use.</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              {paymentOptions.map(opt => {
                const selected = selectedPayment === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.paymentCard, selected && styles.paymentCardSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPayment(opt.key)}
                  >
                    {opt.logoUrl ? (
                      <Image source={{ uri: opt.logoUrl }} style={[styles.paymentLogoLarge, opt.key === 'esewa' && styles.paymentLogoXXL]} resizeMode="contain" />
                    ) : (
                      <Ionicons name={opt.icon} size={32} color={opt.color} style={{ marginRight: 18 }} />
                    )}
                    <Text style={styles.paymentCardLabel}>{opt.label}</Text>
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.addCardBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={22} color="#bbb" style={{ marginRight: 8 }} />
                <Text style={styles.addCardText}>Add New Card</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedPayment && styles.nextBtnDisabled]}
              disabled={!selectedPayment}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaViewContext>
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
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  fullScreenSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 0,
    minHeight: '70%',
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentBackBtn: {
    marginRight: 8,
    padding: 4,
  },
  paymentScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },
  paymentSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 18,
    marginLeft: 2,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#f3e8ff',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentLogoLarge: {
    width: 38,
    height: 38,
    marginRight: 18,
  },
  paymentLogoXXL: {
    width: 60,
    height: 60,
    marginRight: 18,
  },
  paymentCardLabel: {
    fontSize: 17,
    color: '#222',
    fontWeight: '600',
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 18,
  },
  addCardText: {
    color: '#bbb',
    fontSize: 16,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  nextBtnDisabled: {
    backgroundColor: '#ccc',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default OrderConfirmationScreen; 