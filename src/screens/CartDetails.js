import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, Image, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const CartDetails = ({ navigation, route }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  // Refresh cart data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  // Also refresh when route params indicate refresh is needed
  useEffect(() => {
    if (route.params?.refresh) {
      fetchCart();
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  const fetchCart = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.254.5:8000/api/cart/', {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          // Navigate to login or clear tokens
          return;
        }
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Cart data received:', data);
      setCartItems(data);
      
      // Calculate total from the total_price field of each item
      let sum = 0;
      data.forEach(item => {
        if (item.total_price) {
          sum += parseFloat(item.total_price);
        } else if (item.food_price && item.quantity) {
          sum += parseFloat(item.food_price) * item.quantity;
        }
      });
      setTotal(sum);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setTotal(0);
      if (!isRefreshing) {
        Alert.alert('Error', 'Failed to load cart items. Please try again.');
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchCart(true);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }
    
    Alert.alert(
      'Checkout',
      `Total: ₹${total.toFixed(2)}\n\nProceed to checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: async () => {
          try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
              Alert.alert('Login Required', 'Please log in to checkout.');
              return;
            }

            const response = await fetch('http://192.168.254.5:8000/api/cart/checkout/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                description: `Order from ${new Date().toLocaleDateString()}`,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to create order');
            }

            const result = await response.json();
            
            Alert.alert(
              'Order Placed Successfully! 🎉',
              `Order #${result.order.id} has been created.\n\nTotal: ₹${result.order.total_amount}\n\nYour cart has been cleared.`,
              [
                { 
                  text: 'Continue Shopping', 
                  onPress: () => {
                    // Clear cart state and go back
                    setCartItems([]);
                    setTotal(0);
                    navigation.goBack();
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Checkout Failed', error.message || 'Could not process your order. Please try again.');
          }
        }}
      ]
    );
  };

  const clearCart = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.254.5:8000/api/cart/clear/', {
        method: 'DELETE',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          return;
        }
        throw new Error(`Failed to clear cart: ${response.status}`);
      }
      setCartItems([]);
      setTotal(0);
      Alert.alert('Cart Cleared', 'Your cart has been cleared.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Could not clear cart. Please try again.');
    }
  };

  const confirmClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const foodName = item.food_item?.name || 'Unknown Item';
    const foodImage = item.food_item?.image;
    const sizeName = item.size?.size || 'No size';
    const quantity = item.quantity || 1;
    const itemPrice = item.food_price || 0;
    const itemTotal = item.total_price || (itemPrice * quantity);

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemImageContainer}>
          {foodImage ? (
            <Image 
              source={{ uri: foodImage.startsWith('http') ? foodImage : `http://192.168.254.5:8000${foodImage}` }} 
              style={styles.itemImage} 
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant" size={24} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{foodName}</Text>
          <Text style={styles.itemSize}>Size: {sizeName}</Text>
          <Text style={styles.itemSpice}>Spice Level: {item.spice_level || 'Mild'}</Text>
        </View>
        
        <View style={styles.itemQuantities}>
          <Text style={styles.itemQty}>Qty: {quantity}</Text>
          <Text style={styles.itemPrice}>Price per piece: ₹{itemPrice.toFixed(2)}</Text>
          <Text style={styles.itemTotal}>Total price: ₹{itemTotal.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContentRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 2, padding: 4, marginLeft: -12 }}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          onPress={confirmClearCart} 
          style={styles.clearCartBtn}
          disabled={cartItems.length === 0}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={cartItems.length === 0 ? "#ccc" : "#FF6B35"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading cart details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      <StatusBar style="dark" />
      {renderHeader()}
      <View style={styles.contentContainer}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Add some delicious items to get started!</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
            <View style={styles.checkoutSection}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.checkoutBtn, cartItems.length === 0 && styles.disabledBtn]} 
                onPress={() => handleCheckout()}
                disabled={cartItems.length === 0}
              >
                <Text style={styles.checkoutBtnText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { 
    padding: 16,
    flex: 1,
    paddingTop: 0,
    marginTop: 0,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  headerRow: { 
    flexDirection: 'row', 
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: { 
    flex: 1, 
    fontWeight: 'bold', 
    color: '#333',
    fontSize: 14,
  },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 14,
    color: '#666',
  },
  itemSpice: {
    fontSize: 14,
    color: '#666',
  },
  itemQuantities: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  itemQty: { 
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: { 
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemTotal: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  checkoutSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { 
    fontSize: 16, 
    color: '#666',
    fontWeight: '500',
  },
  totalValue: { 
    fontSize: 24, 
    color: '#FF6B35',
    fontWeight: '700',
  },
  checkoutBtn: { 
    backgroundColor: '#FF6B35', 
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkoutBtnText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  cartHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'left',
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    marginVertical: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
    marginVertical: 0,
    paddingVertical: 0,
  },
  backArrow: {
    marginRight: 4,
    marginVertical: 0,
    paddingVertical: 0,
  },
  clearCartBtn: {
    padding: 0,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CartDetails; 