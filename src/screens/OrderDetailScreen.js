import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { fetchWithAutoRefresh } from '../services/api';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch(`http://192.168.1.90:8000/api/orders/${orderId}/`, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'delivered':
        return 'car-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContentRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}> 
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaViewContext>
    );
  }

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      <StatusBar style="dark" />
      {renderHeader()}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Order Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={getStatusIcon(order.status)} 
              size={24} 
              color={getStatusColor(order.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
          </Text>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items && order.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.food_item.name}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              
              {/* Item Details */}
              <View style={styles.itemDetails}>
                {item.size && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>{item.size}</Text>
                  </View>
                )}
                {item.spice_level && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Spice Level:</Text>
                    <Text style={styles.detailValue}>{item.spice_level}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price per item:</Text>
                  <Text style={styles.detailValue}>₹{item.price}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total for this item:</Text>
                  <Text style={styles.detailValue}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{order.total_amount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount}</Text>
          </View>
        </View>

        {/* Delivery Information */}
        {order.delivery_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{order.delivery_address}</Text>
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Cash on Delivery</Text>
          </View>
        </View>

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Order Placed</Text>
              <Text style={styles.timelineTime}>
                {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
              </Text>
            </View>
          </View>
          {order.status !== 'pending' && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Confirmed</Text>
                <Text style={styles.timelineTime}>
                  {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
          {(order.status === 'delivered' || order.status === 'completed') && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Delivered</Text>
                <Text style={styles.timelineTime}>
                  {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  errorText: {
    marginTop: 12,
    fontSize: 18,
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
  statusSection: {
    marginBottom: 30,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderId: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  itemDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#222',
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default OrderDetailScreen; 