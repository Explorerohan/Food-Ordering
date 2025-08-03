import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, StyleSheet, Image, Platform, StatusBar, Modal, TextInput, Dimensions, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { fetchWithAutoRefresh, orderApi } from '../services/api';
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const CartDetails = ({ navigation, route }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderDescription, setOrderDescription] = useState('');
  const [proceeding, setProceeding] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalTotal, setMapModalTotal] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null); // { latitude, longitude }
  
  // Debug function to track selectedLocation changes
  const setSelectedLocationWithLog = (location) => {
    console.log('setSelectedLocation called with:', location);
    setSelectedLocation(location);
  };
  const [hasDirections, setHasDirections] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(''); // Move address state to parent
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

  // Replace fetchAddressFromCoords with LocationIQ reverse geocoding
  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=pk.9c9e6ad214f9ff0a5929ee44fa79463c&lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      } else {
        setSelectedAddress('');
      }
    } catch (e) {
      setSelectedAddress('');
    }
  };

  // Calculate delivery charge when location or total changes
  const calculateDeliveryCharge = async (latitude, longitude, subtotal) => {
    console.log('=== CALCULATE DELIVERY CHARGE CALLED ===');
    console.log('Calculating delivery charge with:', { latitude, longitude, subtotal });
    if (!latitude || !longitude) {
      console.log('No latitude/longitude provided, returning early');
      setDeliveryCharge(0);
      setDistance(0);
      setIsFreeDelivery(false);
      setHasDirections(false);
      return;
    }

    try {
      const deliveryInfo = await orderApi.getDeliveryEstimate(latitude, longitude, subtotal);
      console.log('Delivery info received:', deliveryInfo);
      setDeliveryCharge(deliveryInfo.delivery_charge);
      setDistance(deliveryInfo.distance_km);
      setIsFreeDelivery(deliveryInfo.is_free_delivery);
      setHasDirections(true); // Set flag when delivery info is received
    } catch (error) {
      console.error('Error calculating delivery charge:', error);
      setDeliveryCharge(0);
      setDistance(0);
      setIsFreeDelivery(false);
      setHasDirections(false);
    }
  };

  // Update address and delivery charge when selectedLocation changes
  useEffect(() => {
    console.log('=== USEFFECT TRIGGERED ===');
    console.log('selectedLocation changed to:', selectedLocation);
    console.log('total:', total);
    if (selectedLocation) {
      console.log('useEffect triggered - selectedLocation:', selectedLocation, 'total:', total);
      fetchAddressFromCoords(selectedLocation.latitude, selectedLocation.longitude);
      calculateDeliveryCharge(selectedLocation.latitude, selectedLocation.longitude, total);
    } else {
      console.log('No selectedLocation, clearing states');
      setSelectedAddress('');
      setDeliveryCharge(0);
      setDistance(0);
      setIsFreeDelivery(false);
      setHasDirections(false);
    }
  }, [selectedLocation, total]);

  const fetchCart = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch(getApiUrl(API_ENDPOINTS.CART), {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });
      
      const data = await response.json();
      console.log('Cart data received:', data);
      const items = Array.isArray(data) ? data : (data.items || data.cart_items || []);
      setCartItems(items);
      
      // Calculate total from the total_price field of each item
      let sum = 0;
      items.forEach(item => {
        if (item.total_price) {
          sum += parseFloat(item.total_price);
        } else if (item.food_price && item.quantity) {
          sum += parseFloat(item.food_price) * item.quantity;
        }
      });
      setTotal(sum);
      console.log('Cart total calculated:', sum);
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
    navigation.navigate('CheckoutFormScreen', { cartItems });
  };

  const handleProceedCheckout = async () => {
    if (!selectedLocation || !selectedAddress) {
      Alert.alert('Missing Address', 'Please select your delivery address on the map.');
      return;
    }
    console.log('Selected address at checkout:', selectedAddress);
    console.log('Order payload:', {
      description: orderDescription,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      delivery_address: selectedAddress,
    });
    setProceeding(true);
    try {
      const itemsPayload = cartItems.map(item => ({
        food_item: item.food_item.id,
        quantity: item.quantity,
        price: item.food_price || (item.size && item.size.price) || 0,
        size: item.size ? item.size.size : '',  // Add size field
        spice_level: item.spice_level || 'Mild',  // Add spice_level field
      }));

      const orderData = {
        description: orderDescription,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        delivery_address: selectedAddress,
        payment_method: 'cod', // Default to cash on delivery
        items: itemsPayload,
      };

      const result = await orderApi.createOrder(orderData);
      setShowCheckoutModal(false);
      setOrderDescription('');
      setSelectedLocationWithLog(null);
      setProceeding(false);
      Alert.alert(
        'Order Placed Successfully! 🎉',
        `Order #${result.id} has been created.\n\n📋 Order Summary:\n• Food Total: ₹${result.subtotal}\n• Delivery Charge: ₹${result.delivery_charge}\n• Distance: ${result.distance_km} km\n• Total Paid: ₹${result.total_amount}\n\nYour cart has been cleared.`,
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
        return await fetch(getApiUrl(API_ENDPOINTS.CART_CLEAR), {
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
                              source={{ uri: foodImage.startsWith('http') ? foodImage : getApiUrl(foodImage) }} 
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
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={[styles.backArrow, {marginLeft: -12, marginRight: 2}]}>
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
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
              {selectedLocation && (
                <>
                  <View style={styles.deliveryInfoContainer}>
                    <Text style={styles.deliveryLabel}>Delivery Charge</Text>
                    <Text style={[styles.deliveryValue, isFreeDelivery && styles.freeDeliveryText]}>
                      {isFreeDelivery ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                    </Text>
                  </View>
                  <View style={styles.distanceContainer}>
                    <Text style={styles.distanceLabel}>Distance: {distance.toFixed(1)} km</Text>
                  </View>
                </>
              )}
              <View style={styles.finalTotalContainer}>
                <Text style={styles.finalTotalLabel}>Total</Text>
                <Text style={styles.finalTotalValue}>₹{(total + deliveryCharge).toFixed(2)}</Text>
              </View>
              {cartItems.length > 0 && (
                <TouchableOpacity 
                  style={styles.checkoutBtn}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutBtnText}>Checkout</Text>
                </TouchableOpacity>
              )}
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
              onPress={async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission denied', 'Location permission is required to pick your delivery location.');
                  return;
                }
                // Get current location for centering map
                try {
                  let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                    maximumAge: 10000,
                    timeout: 20000,
                  });
                  const region = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                  setInitialRegion(region);
                  setSearchRegion(region);
                  setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  });
                } catch (e) {
                  // fallback to default region if location fails
                }
                // Set the current total for the map modal
                console.log('Opening map modal with total:', total);
                setMapModalTotal(total);
                setShowMapModal(true);
                
                // Set initial location if current location is available
                if (currentLocation) {
                  console.log('Setting initial location from currentLocation:', currentLocation);
                  setSelectedLocationWithLog(currentLocation);
                }
              }}
            >
              <Ionicons name="location-outline" size={20} color="#FF6B35" />
              <Text style={styles.locationBtnText}>
                {selectedLocation
                  ? (selectedAddress || 'Location has been choosed')
                  : 'Choose current address for delivery'}
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
        presentationStyle="overFullScreen"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}> 
            <MapView
              ref={mapRef}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              region={searchRegion}
              onPress={e => {
                console.log('Map pressed at:', e.nativeEvent.coordinate);
                const region = {
                  latitude: e.nativeEvent.coordinate.latitude,
                  longitude: e.nativeEvent.coordinate.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                console.log('Setting selectedLocation from map press:', e.nativeEvent.coordinate);
                setSelectedLocationWithLog(e.nativeEvent.coordinate);
                setSearchRegion(region);
                if (mapRef.current) {
                  mapRef.current.animateToRegion(region, 1000);
                }
                // Fetch address for tapped location
                (async () => {
                  try {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    const response = await fetch(
                      `https://us1.locationiq.com/v1/reverse.php?key=pk.9c9e6ad214f9ff0a5929ee44fa79463c&lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();
                    if (data && data.display_name) {
                      setSelectedAddress(data.display_name);
                    } else {
                      setSelectedAddress('Address not found');
                    }
                  } catch {
                    setSelectedAddress('Error fetching address');
                  }
                })();
              }}
            >
              {selectedLocation && (
                <Marker coordinate={selectedLocation} />
              )}
            </MapView>
            <GooglePlacesAutocomplete
              ref={placesRef}
              placeholder="Type your address here to pick from map"
              fetchDetails={true}
              onPress={(data, details = null) => {
                const { lat, lng } = details.geometry.location;
                const region = {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setSelectedLocationWithLog({ latitude: lat, longitude: lng });
                setSearchRegion(region);
                if (mapRef.current) {
                  mapRef.current.animateToRegion(region, 1000);
                }
                // Set address in parent
                const plusCode = details.plus_code?.global_code;
                const address = details.formatted_address || data.description;
                setSelectedAddress(plusCode ? `${plusCode}, ${address}` : address);
              }}
              query={{
                key: 'pk.9c9e6ad214f9ff0a5929ee44fa79463c',
                language: 'en',
                location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : undefined,
                radius: 50000,
              }}
              styles={{
                container: { position: 'absolute', top: 18, width: '90%', left: '5%', zIndex: 10 },
                textInputContainer: {
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  zIndex: 10,
                },
                textInput: { fontSize: 16, color: '#222', backgroundColor: '#fff' },
                listView: {
                  backgroundColor: 'white',
                  zIndex: 100,
                  elevation: 10,
                  borderRadius: 12,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: '#eee',
                  maxHeight: 250,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
              }}
              enablePoweredByContainer={false}
              keyboardShouldPersistTaps="handled"
              renderRightButton={() => null}
              renderRow={(data) => (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                  backgroundColor: '#fff',
                }}>
                  <Ionicons name="location-sharp" size={22} color="#1abc60" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#222' }}>{data.description}</Text>
                </View>
              )}
            />
            
                        {/* Delivery Pricing Display Above Map */}
            {console.log('Checking if selectedLocation exists:', !!selectedLocation, 'hasDirections:', hasDirections, 'deliveryCharge:', deliveryCharge)}
            {(selectedLocation || hasDirections || deliveryCharge > 0) && (() => {
              console.log('=== DELIVERY PRICING CARD DEBUG ===');
              console.log('selectedLocation:', selectedLocation);
              console.log('total state:', total);
              console.log('mapModalTotal:', mapModalTotal);
              console.log('deliveryCharge:', deliveryCharge);
              console.log('distance:', distance);
              console.log('cartItems length:', cartItems?.length);
              console.log('Cart items:', cartItems);
              
              // Calculate total as fallback if state total is 0
              let calculatedTotal = total;
              
              // Try to get total from mapModalTotal first (most reliable)
              if (mapModalTotal > 0) {
                calculatedTotal = mapModalTotal;
                console.log('Using total from mapModalTotal:', calculatedTotal);
              }
              // Then try route params
              else if (route.params?.cartTotal && route.params.cartTotal > 0) {
                calculatedTotal = route.params.cartTotal;
                console.log('Using total from route params:', calculatedTotal);
              }
              // Then try cart items if still 0
              else if (total <= 0 && cartItems && cartItems.length > 0) {
                calculatedTotal = cartItems.reduce((sum, item) => {
                  console.log('Processing item:', item);
                  if (item.total_price) {
                    const itemTotal = parseFloat(item.total_price);
                    console.log('Using total_price:', itemTotal);
                    return sum + itemTotal;
                  } else if (item.food_price && item.quantity) {
                    const itemTotal = parseFloat(item.food_price) * item.quantity;
                    console.log('Using food_price * quantity:', itemTotal);
                    return sum + itemTotal;
                  } else if (item.price && item.quantity) {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    console.log('Using price * quantity:', itemTotal);
                    return sum + itemTotal;
                  }
                  console.log('No valid price found for item');
                  return sum;
                }, 0);
              }
              console.log('Final calculated total for map:', calculatedTotal, 'State total:', total);
              console.log('=== END DELIVERY PRICING CARD DEBUG ===');
              
              return (
                <View style={styles.mapDeliveryChargeDisplay}>
                  <View style={styles.mapDeliveryChargeContent}>
                    <View style={styles.mapDeliveryChargeHeaderRow}>
                      <View style={styles.mapDeliveryChargeHeaderLeft}>
                        <Ionicons name="restaurant-outline" size={20} color="#FF6B35" />
                        <Text style={styles.mapDeliveryChargeHeader}>Delivery Pricing</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedLocationWithLog(null)}>
                        <Ionicons name="close" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.mapDeliveryChargeSummary}>
                      <View style={styles.mapDeliveryChargeSummaryItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.mapDeliveryChargeSummaryText}>
                          {Math.ceil(distance * 3)} min
                        </Text>
                      </View>
                      <View style={styles.mapDeliveryChargeSummaryItem}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.mapDeliveryChargeSummaryText}>
                          {distance.toFixed(1)} km
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.mapDeliveryChargeRow}>
                      <Ionicons name="fast-food-outline" size={20} color="#4CAF50" />
                      <Text style={styles.mapDeliveryChargeLabel}>Food Total:</Text>
                      <Text style={styles.mapDeliveryChargeValue}>
                        ₹{calculatedTotal.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.mapDeliveryChargeRow}>
                      <Ionicons name="car-outline" size={20} color="#FF6B35" />
                      <Text style={styles.mapDeliveryChargeLabel}>Delivery Charge:</Text>
                      <Text style={[styles.mapDeliveryChargeValue, isFreeDelivery && styles.freeDeliveryText]}>
                        {isFreeDelivery ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                      </Text>
                    </View>
                    <View style={[styles.mapDeliveryChargeRow, styles.mapDeliveryChargeTotalRow]}>
                      <Ionicons name="wallet-outline" size={20} color="#222" />
                      <Text style={styles.mapDeliveryChargeTotalLabel}>Total to Pay:</Text>
                      <Text style={styles.mapDeliveryChargeTotal}>₹{(calculatedTotal + deliveryCharge).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
            
            {/* Order Summary and Buttons at the bottom of the modal */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
              {/* Order Summary */}
              {selectedLocation && (() => {
                const calculatedTotal = total > 0 ? total : cartItems.reduce((sum, item) => {
                  if (item.total_price) {
                    return sum + parseFloat(item.total_price);
                  } else if (item.food_price && item.quantity) {
                    return sum + parseFloat(item.food_price) * item.quantity;
                  }
                  return sum;
                }, 0);
                return (
                <View style={styles.mapOrderSummary}>
                  <Text style={styles.mapOrderSummaryTitle}>Order Summary</Text>
                  <View style={styles.mapOrderSummaryRow}>
                    <Text style={styles.mapOrderSummaryLabel}>Food Total:</Text>
                    <Text style={styles.mapOrderSummaryValue}>₹{calculatedTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.mapOrderSummaryRow}>
                    <Text style={styles.mapOrderSummaryLabel}>Delivery Charge:</Text>
                    <Text style={[styles.mapOrderSummaryValue, isFreeDelivery && styles.freeDeliveryText]}>
                      {isFreeDelivery ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                    </Text>
                  </View>
                  <View style={styles.mapOrderSummaryRow}>
                    <Text style={styles.mapOrderSummaryLabel}>Distance:</Text>
                    <Text style={styles.mapOrderSummaryValue}>{distance.toFixed(1)} km</Text>
                  </View>
                  <View style={[styles.mapOrderSummaryRow, styles.mapOrderSummaryTotal]}>
                    <Text style={styles.mapOrderSummaryTotalLabel}>Total to Pay:</Text>
                    <Text style={styles.mapOrderSummaryTotalValue}>₹{(calculatedTotal + deliveryCharge).toFixed(2)}</Text>
                  </View>
                </View>
              );
              })()}
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF6B35', marginBottom: 10, width: '100%' }]}
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
                      timeout: 20000,
                    });
                    setSelectedLocationWithLog({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    });
                    // Fetch address for current location
                    try {
                      const response = await fetch(
                        `https://us1.locationiq.com/v1/reverse.php?key=pk.9c9e6ad214f9ff0a5929ee44fa79463c&lat=${location.coords.latitude}&lon=${location.coords.longitude}&format=json`
                      );
                      const data = await response.json();
                      if (data && data.display_name) {
                        setSelectedAddress(data.display_name);
                      } else {
                        setSelectedAddress('Address not found');
                      }
                    } catch {
                      setSelectedAddress('Error fetching address');
                    }
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity onPress={() => setShowMapModal(false)} style={[styles.modalBtn, { backgroundColor: '#ccc', flex: 1, marginRight: 8 }]}> 
                  <Text style={{ color: '#222', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setShowMapModal(false)} 
                  style={[styles.modalBtn, { backgroundColor: '#FF6B35', flex: 1, marginLeft: 8 }]} 
                  disabled={!selectedLocation}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Select</Text>
                </TouchableOpacity>
              </View>
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
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deliveryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  deliveryValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  freeDeliveryText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  distanceContainer: {
    paddingVertical: 4,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  finalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#FF6B35',
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 18,
    color: '#222',
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  mapOrderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapOrderSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapOrderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mapOrderSummaryLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  mapOrderSummaryValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  mapOrderSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  mapOrderSummaryTotalLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  mapOrderSummaryTotalValue: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  mapDeliveryChargeDisplay: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 15,
  },
  mapDeliveryChargeContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  mapDeliveryChargeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapDeliveryChargeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapDeliveryChargeHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  mapDeliveryChargeSummary: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  mapDeliveryChargeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  mapDeliveryChargeSummaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  mapDeliveryChargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapDeliveryChargeLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  mapDeliveryChargeValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  mapDeliveryChargeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  mapDeliveryChargeTotalLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  mapDeliveryChargeTotal: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
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