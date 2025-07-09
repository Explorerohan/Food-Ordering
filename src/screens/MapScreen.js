import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Dimensions, StatusBar, Platform, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const LOCATIONIQ_TOKEN = 'pk.9c9e6ad214f9ff0a5929ee44fa79463c';
const RESTAURANT_LOCATION = { latitude: 26.663703836851116, longitude: 87.27978374809027 };

const MapScreen = ({ navigation, route }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [gettingCurrent, setGettingCurrent] = useState(false);
  const [directionDetails, setDirectionDetails] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [loadingDirections, setLoadingDirections] = useState(false);

  const searchLocation = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://api.locationiq.com/v1/autocomplete.php`,
        {
          params: {
            key: LOCATIONIQ_TOKEN,
            q: text,
            limit: 5,
            format: 'json',
          },
        }
      );
      setResults(response.data);
    } catch (error) {
      setResults([]);
    }
  };

  const fetchDirections = async (fromLocation, toLocation) => {
    setLoadingDirections(true);
    console.log('Fetching directions from:', fromLocation, 'to:', toLocation);
    try {
      const directionsRes = await axios.get(
        `https://us1.locationiq.com/v1/directions/driving/${fromLocation.longitude},${fromLocation.latitude};${toLocation.longitude},${toLocation.latitude}`,
        {
          params: {
            key: LOCATIONIQ_TOKEN,
            steps: true,
            geometries: 'geojson',
            overview: 'full',
          },
        }
      );
      
              if (directionsRes.data.routes && directionsRes.data.routes.length > 0) {
          const route = directionsRes.data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          console.log('Route coordinates received:', coords.length, 'points');
          setRouteCoords(coords);
        
        // Extract direction details
        const details = {
          distance: route.distance,
          duration: route.duration,
          steps: route.legs[0].steps || [],
          summary: route.legs[0].summary || ''
        };
        setDirectionDetails(details);
        setShowDirections(true);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Could not fetch directions. Please try again.');
      setRouteCoords([]);
      setDirectionDetails(null);
    } finally {
      setLoadingDirections(false);
    }
  };

  const handleSelectLocation = async (item) => {
    setQuery(item.display_name);
    setResults([]);
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const newLocation = { latitude: lat, longitude: lon, display_name: item.display_name };
    setSelectedLocation(newLocation);
    
    // Fetch directions from selected location to restaurant
    await fetchDirections(newLocation, RESTAURANT_LOCATION);
  };

  const handleSelectCurrentLocation = async () => {
    setGettingCurrent(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        setGettingCurrent(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // Get address for current location
      const address = await fetchAddressFromCoords(newLocation.latitude, newLocation.longitude);
      newLocation.display_name = address;
      
      setSelectedLocation(newLocation);
      
      // Fetch directions from current location to restaurant
      await fetchDirections(newLocation, RESTAURANT_LOCATION);
    } catch (e) {
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    } finally {
      setGettingCurrent(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      if (route && route.params && route.params.fromCheckout) {
        navigation.navigate({
          name: 'CheckoutFormScreen',
          params: { selectedLocation },
          merge: true,
        });
      } else {
        navigation.goBack();
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_TOKEN}&lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } catch (e) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    console.log('Map tapped at:', newLocation);
    
    // Get address for the tapped location
    const address = await fetchAddressFromCoords(latitude, longitude);
    newLocation.display_name = address;
    
    setSelectedLocation(newLocation);
    // Fetch directions from tapped location to restaurant
    await fetchDirections(newLocation, RESTAURANT_LOCATION);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: RESTAURANT_LOCATION.latitude,
          longitude: RESTAURANT_LOCATION.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={selectedLocation ? {
          latitude: (selectedLocation.latitude + RESTAURANT_LOCATION.latitude) / 2,
          longitude: (selectedLocation.longitude + RESTAURANT_LOCATION.longitude) / 2,
          latitudeDelta: Math.max(
            Math.abs(selectedLocation.latitude - RESTAURANT_LOCATION.latitude) * 1.5,
            0.01
          ),
          longitudeDelta: Math.max(
            Math.abs(selectedLocation.longitude - RESTAURANT_LOCATION.longitude) * 1.5,
            0.01
          ),
        } : undefined}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={RESTAURANT_LOCATION}
          title="Spicebite Restaurant"
          description="Your destination"
          pinColor="orange"
          anchor={{ x: 0.5, y: 1.0 }}
        />
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Your Location"
            description="Starting point"
            pinColor="blue"
            anchor={{ x: 0.5, y: 1.0 }}
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={[
              { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude },
              ...routeCoords,
              { latitude: RESTAURANT_LOCATION.latitude, longitude: RESTAURANT_LOCATION.longitude }
            ]}
            strokeColor="#FF6B35"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for your location"
          value={query}
          onChangeText={searchLocation}
          style={styles.input}
        />
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelectLocation(item)}
            >
              <Text style={styles.itemText}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      </View>

      {/* Direction Details Panel */}
      {showDirections && directionDetails && (
        <View style={styles.directionPanel}>
          <View style={styles.directionHeader}>
            <Ionicons name="navigate" size={24} color="#FF6B35" />
            <Text style={styles.directionTitle}>Directions to Restaurant</Text>
            <TouchableOpacity onPress={() => setShowDirections(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.directionSummary}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.summaryText}>{formatDuration(directionDetails.duration)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.summaryText}>{formatDistance(directionDetails.distance)}</Text>
            </View>
          </View>

          <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
            {directionDetails.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>{step.maneuver.instruction}</Text>
                  <Text style={styles.stepDistance}>{formatDistance(step.distance)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.currentBtn} 
          onPress={handleSelectCurrentLocation} 
          disabled={gettingCurrent || loadingDirections}
        >
          <Ionicons name="locate" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.currentBtnText}>
            {gettingCurrent ? 'Locating...' : 'Use My Current Location'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.bottomBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectBtn, !selectedLocation && { backgroundColor: '#ccc' }]}
            onPress={handleConfirm}
            disabled={!selectedLocation}
          >
            <Text style={styles.selectBtnText}>Select This Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {loadingDirections && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Getting directions...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  map: { 
    flex: 1 
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 180,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  directionPanel: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 120,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 15,
  },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  directionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  directionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  stepsContainer: {
    maxHeight: 180,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 2,
  },
  stepDistance: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    zIndex: 20,
    alignItems: 'center',
  },
  currentBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginRight: 10,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 16,
  },
  selectBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default MapScreen; 