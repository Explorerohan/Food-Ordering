import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, Image, Platform, StatusBar, Modal, TextInput, Dimensions, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { fetchWithAutoRefresh } from '../services/api';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // <-- Replace with your API key

const CartDetails = ({ navigation, route }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderDescription, setOrderDescription] = useState('');
  const [proceeding, setProceeding] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // { latitude, longitude }
  const [initialRegion, setInitialRegion] = useState({
    latitude: 27.7172, // Default to Kathmandu
    longitude: 85.3240,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchRegion, setSearchRegion] = useState(initialRegion);
  const [currentLocation, setCurrentLocation] = useState(null);
  const mapRef = useRef(null);
  const placesRef = useRef(null);

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

  // Get user's current location for map centering
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setInitialRegion(region);
      setSearchRegion(region);
    })();
  }, []);

  // When map modal opens, get current location
  useEffect(() => {
    if (showMapModal) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          maximumAge: 10000,
          timeout: 20000,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      })();
    }
  }, [showMapModal]);

  const fetchCart = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch('http://192.168.1.90:8000/api/cart/', {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });
      
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

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleProceedCheckout = async () => {
    if (!selectedLocation) {
      Alert.alert('Missing Location', 'Please select your delivery location.');
      return;
    }
    setProceeding(true);
    try {
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch('http://192.168.1.90:8000/api/cart/checkout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            description: orderDescription,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }),
        });
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();
      setShowCheckoutModal(false);
      setOrderDescription('');
      setSelectedLocation(null);
      setProceeding(false);
      Alert.alert(
        'Order Placed Successfully! 🎉',
        `Order #${result.order.id} has been created.\n\nTotal: ₹${result.order.total_amount}\n\nYour cart has been cleared.`,
        [
          { 
            text: 'Continue Shopping', 
            onPress: () => {
              setCartItems([]);
              setTotal(0);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      setProceeding(false);
      Alert.alert('Checkout Failed', error.message || 'Could not process your order. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch('http://192.168.1.90:8000/api/cart/clear/', {
          method: 'DELETE',
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });
      
      if (!response.ok) {
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
                              source={{ uri: foodImage.startsWith('http') ? foodImage : `http://192.168.1.90:8000${foodImage}` }} 
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backArrow, {marginLeft: -12, marginRight: 2}]}>
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
                onPress={handleCheckout}
                disabled={cartItems.length === 0}
              >
                <Text style={styles.checkoutBtnText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      {/* Checkout Modal */}
      <Modal
        visible={showCheckoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Delivery Details</Text>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={() => setShowMapModal(true)}
            >
              <Ionicons name="location-outline" size={20} color="#FF6B35" />
              <Text style={styles.locationBtnText}>
                {selectedLocation
                  ? `Lat: ${selectedLocation.latitude.toFixed(5)}, Lng: ${selectedLocation.longitude.toFixed(5)}`
                  : 'Enter your current address for delivery'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Order Description. If you want to add any special instructions, please add them here."
              value={orderDescription}
              onChangeText={setOrderDescription}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)} style={[styles.modalBtn, { backgroundColor: '#ccc' }]}> 
                <Text style={{ color: '#222', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleProceedCheckout} 
                style={[styles.modalBtn, { backgroundColor: '#FF6B35', marginLeft: 10 }]} 
                disabled={proceeding}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>{proceeding ? 'Processing...' : 'Proceed'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bigMapModal, { height: SCREEN_HEIGHT * 0.8, width: SCREEN_WIDTH * 0.95 }]}> 
            <GooglePlacesAutocomplete
              ref={placesRef}
              placeholder="Search for a place"
              fetchDetails={true}
              onPress={(data, details = null) => {
                const { lat, lng } = details.geometry.location;
                const region = {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setSelectedLocation({ latitude: lat, longitude: lng });
                setSearchRegion(region);
                if (mapRef.current) {
                  mapRef.current.animateToRegion(region, 1000);
                }
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
                location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : undefined,
                radius: 50000, // 50km
              }}
              styles={{
                container: { 
                  position: 'absolute', 
                  top: 10, 
                  width: '80%',        // Reduce width
                  left: '10%',         // Center horizontally
                  zIndex: 2 
                },
                listView: { backgroundColor: 'white', zIndex: 3 },
                textInputContainer: { position: 'relative' },
                textInput: { fontSize: 16, paddingRight: 36 },
              }}
              enablePoweredByContainer={false}
              renderRightButton={() => (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    zIndex: 10,
                  }}
                  onPress={() => {
                    if (placesRef.current) {
                      placesRef.current.focus();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search" size={20} color="#888" />
                </TouchableOpacity>
              )}
            />
            <MapView
              ref={mapRef}
              style={{ flex: 1, minHeight: 400 }}
              region={searchRegion}
              onPress={e => setSelectedLocation(e.nativeEvent.coordinate)}
            >
              {selectedLocation && (
                <Marker coordinate={selectedLocation} />
              )}
            </MapView>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#FF6B35', margin: 12 }]}
              onPress={async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission denied', 'Location permission is required.');
                  return;
                }
                setProceeding(true);
                try {
                  let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                    maximumAge: 10000,
                    timeout: 20000, // Wait up to 20 seconds for a GPS fix
                  });
                  setSelectedLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  });
                  setShowMapModal(false);
                } catch (e) {
                  Alert.alert('Error', 'Could not get your precise location. Please try again, or move to an area with better GPS signal.');
                }
                setProceeding(false);
              }}
              disabled={proceeding}
            >
              {proceeding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Proceed with Current Location</Text>
              )}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, backgroundColor: '#fff' }}>
              <TouchableOpacity onPress={() => setShowMapModal(false)} style={[styles.modalBtn, { backgroundColor: '#ccc' }]}> 
                <Text style={{ color: '#222', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowMapModal(false)} 
                style={[styles.modalBtn, { backgroundColor: '#FF6B35', marginLeft: 10 }]} 
                disabled={!selectedLocation}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    width: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationBtnText: {
    marginLeft: 8,
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  bigMapModal: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});

export default CartDetails; 