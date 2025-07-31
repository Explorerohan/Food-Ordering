import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { fetchWithAutoRefresh } from '../services/api';
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch(getApiUrl(API_ENDPOINTS.ORDERS), {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleCancelOrder = async (orderId, currentStatus) => {
    // Check if order can be cancelled
    if (['delivered', 'completed', 'cancelled'].includes(currentStatus.toLowerCase())) {
      Alert.alert(
        'Cannot Cancel Order',
        `This order cannot be cancelled because it is already ${currentStatus.toLowerCase()}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetchWithAutoRefresh(async (accessToken) => {
                return await fetch(getApiUrl(API_ENDPOINTS.ORDER_CANCEL.replace('{id}', orderId)), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                  },
                });
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel order');
              }

              const result = await response.json();
              Alert.alert('Success', 'Order cancelled successfully!');
              
              // Refresh the orders list
              fetchOrders();
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', error.message || 'Failed to cancel order. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.order_date).toLocaleDateString()} at {new Date(item.order_date).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        {item.items && item.items.map((orderItem, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{orderItem.food_item.name}</Text>
            <Text style={styles.itemDetails}>
              {orderItem.quantity}x ₹{orderItem.price}
              {orderItem.size && ` • ${orderItem.size}`}
              {orderItem.spice_level && ` • ${orderItem.spice_level}`}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.paymentMethod}>
        <Ionicons name="card-outline" size={16} color="#666" />
        <Text style={styles.paymentMethodText}>
          {item.payment_method === 'cod' ? 'Cash on Delivery' : 
           item.payment_method === 'esewa' ? 'eSewa' :
           item.payment_method === 'khalti' ? 'Khalti' :
           item.payment_method === 'fonepay' ? 'Fonepay' :
           item.payment_method || 'Cash on Delivery'}
        </Text>
      </View>
      
      <View style={styles.orderTotal}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
      </View>
      
      <View style={styles.viewDetailsRow}>
        <Text style={styles.viewDetailsText}>Tap to view details</Text>
        <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
      </View>
      
      {/* Cancel Order Button - Only show for cancellable orders */}
      {['pending', 'confirmed'].includes(item.status.toLowerCase()) && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelOrder(item.id, item.status)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={20} color="#F44336" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#4CAF50';
      case 'delivered':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContentRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backArrow, {marginLeft: -12, marginRight: 2}]}> 
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={fetchOrders} style={{ padding: 4 }}>
          <Ionicons name="refresh" size={24} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      <StatusBar style="dark" />
      {renderHeader()}
      <View style={styles.contentContainer}>
        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyOrdersText}>No orders yet</Text>
            <Text style={styles.emptyOrdersSubtext}>Your order history will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        )}
      </View>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
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
  header: {
    width: '100%',
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  backArrow: {
    marginRight: 4,
  },
  ordersList: {
    paddingBottom: 20,
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderItems: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  emptyOrders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyOrdersText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOrdersSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
});

export default OrderHistoryScreen; 