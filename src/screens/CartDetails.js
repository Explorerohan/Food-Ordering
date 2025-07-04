import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, Image, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

const CartDetails = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.1.148:8000/api/cart/', {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCartItems(data);
      // Calculate total
      let sum = 0;
      data.forEach(item => {
        sum += (item.price || 0) * (item.quantity || 1);
      });
      setTotal(sum);
    } catch (error) {
      setCartItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.1.148:8000/api/cart/', {
        method: 'DELETE',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      setCartItems([]);
      setTotal(0);
      Alert.alert('Cart Cleared', 'Your cart has been cleared.');
    } catch (error) {
      Alert.alert('Error', 'Could not clear cart.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      {item.food_item && item.food_item.image && (
        <Image source={{ uri: item.food_item.image }} style={styles.itemImage} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.food_item?.name || 'Item'}</Text>
      </View>
      <Text style={styles.itemQty}>x{item.quantity}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContentRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text>Loading cart details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      {renderHeader()}
      <View style={styles.contentContainer}>
        {cartItems.length === 0 ? (
          <Text>Your cart is empty.</Text>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Item</Text>
              <Text style={styles.headerText}>Qty</Text>
              <Text style={styles.headerText}>Price</Text>
              <Text style={styles.headerText}>Total</Text>
            </View>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Clear Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  headerRow: { flexDirection: 'row', marginBottom: 8 },
  headerText: { flex: 1, fontWeight: 'bold', color: '#333' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  itemName: { flex: 2, color: '#222' },
  itemDesc: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  itemQty: { flex: 1, textAlign: 'center', color: '#222' },
  itemPrice: { flex: 1, textAlign: 'center', color: '#222' },
  itemTotal: { flex: 1, textAlign: 'center', color: '#222' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  totalLabel: { fontWeight: 'bold', fontSize: 16, marginRight: 8 },
  totalValue: { fontWeight: 'bold', fontSize: 16, color: '#FF6B35' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  clearBtn: { backgroundColor: '#FF6B35', padding: 12, borderRadius: 8 },
  clearBtnText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { backgroundColor: '#ccc', padding: 12, borderRadius: 8 },
  backBtnText: { color: '#333', fontWeight: 'bold' },
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
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 4,
  },
});

export default CartDetails; 