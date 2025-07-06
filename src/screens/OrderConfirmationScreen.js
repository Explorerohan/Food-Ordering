import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderConfirmationScreen = (props) => {
  // Support both navigation (screen) and modal (props)
  const { route, navigation, item: propItem, selectedSize: propSelectedSize, selectedSpice: propSelectedSpice, onClose, isModal } = props;
  const item = propItem || (route && route.params && route.params.item);
  const selectedSize = propSelectedSize || (route && route.params && route.params.selectedSize);
  const selectedSpice = propSelectedSpice || (route && route.params && route.params.selectedSpice);
  const [quantity, setQuantity] = useState(1);
  const sizeObj = item && item.sizes ? item.sizes.find(s => s.size === selectedSize) : null;
  const price = sizeObj ? sizeObj.price : (item ? item.price : 0);
  const total = price * quantity;

  return (
    <View style={[styles.safeArea, isModal && { paddingTop: 0 }]}> 
      <View style={styles.header}>
        {isModal ? (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Order Confirmation</Text>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Size: <Text style={styles.detailValue}>{selectedSize}</Text></Text>
        <Text style={styles.detail}>Spice Level: <Text style={styles.detailValue}>{selectedSpice}</Text></Text>
        <Text style={styles.detail}>Price: <Text style={styles.detailValue}>₹{price}</Text></Text>
        <View style={styles.quantityRow}>
          <Text style={styles.detail}>Quantity:</Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
              <Ionicons name="remove" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
              <Ionicons name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.total}>Total: ₹{total}</Text>
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, alignItems: 'center' },
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
});

export default OrderConfirmationScreen; 