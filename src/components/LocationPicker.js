import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';

const LocationPicker = ({ onLocationPicked }) => {
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [proceeding, setProceeding] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false); // For reverse geocoding
  const placesRef = useRef();

  // Reverse geocoding function
  const getAddressFromCoords = async (lat, lng) => {
    try {
      setAddressLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      setAddressLoading(false);
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return 'Address not found';
      }
    } catch (e) {
      setAddressLoading(false);
      return 'Error fetching address';
    }
  };

  // If only lat/lng are set, fetch address
  React.useEffect(() => {
    if (selectedCoords && !selectedAddress) {
      (async () => {
        const addr = await getAddressFromCoords(selectedCoords.lat, selectedCoords.lng);
        setSelectedAddress(addr);
      })();
    }
  }, [selectedCoords, selectedAddress]);

  const handleProceed = async () => {
    if (!selectedAddress || !selectedCoords) {
      Alert.alert('Error', 'Please select a location first.');
      return;
    }
    setProceeding(true);
    try {
      // Example: send to backend
      // await fetch('YOUR_BACKEND_ENDPOINT', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     address: selectedAddress,
      //     latitude: selectedCoords.lat,
      //     longitude: selectedCoords.lng,
      //   }),
      // });
      if (onLocationPicked) {
        onLocationPicked({
          address: selectedAddress,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
        });
      }
      Alert.alert('Success', 'Location sent to backend!');
    } catch (e) {
      Alert.alert('Error', 'Failed to send location.');
    }
    setProceeding(false);
  };

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder="Type your address here"
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details) {
            setSelectedAddress(details.formatted_address);
            setSelectedCoords(details.geometry.location);
          }
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
        }}
        styles={{
          container: { flex: 0, zIndex: 10 },
          textInputContainer: {
            backgroundColor: '#fff',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            elevation: 2,
            marginTop: 20,
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
            maxHeight: 350,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          },
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        renderRow={(data) => {
          const isSearch = data.structured_formatting?.main_text_matched_substrings?.length === 0;
          return (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
              backgroundColor: '#fff',
            }}>
              <Ionicons
                name={isSearch ? 'search' : 'location-sharp'}
                size={22}
                color={isSearch ? '#FF6B35' : '#1abc60'}
                style={{ marginRight: 12 }}
              />
              <View>
                <Text style={{ fontSize: 16, color: '#222' }}>
                  {data.structured_formatting?.main_text || data.description}
                </Text>
                {data.structured_formatting?.secondary_text ? (
                  <Text style={{ fontSize: 13, color: '#888' }}>
                    {data.structured_formatting.secondary_text}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
      {selectedCoords && !selectedAddress && addressLoading ? (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedLabel}>Fetching address...</Text>
        </View>
      ) : null}
      {selectedAddress ? (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedLabel}>Selected Address:</Text>
          <Text style={styles.selectedAddress}>{selectedAddress}</Text>
          <Text style={styles.selectedCoords}>
            Lat: {selectedCoords?.lat}, Lng: {selectedCoords?.lng}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.proceedBtn}
        onPress={handleProceed}
        disabled={!selectedAddress || !selectedCoords || proceeding}
      >
        <Text style={styles.proceedBtnText}>
          {proceeding ? 'Processing...' : 'Proceed with this location'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  suggestionRow: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: { fontSize: 16, color: '#222' },
  selectedBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 18,
    marginBottom: 8,
    elevation: 1,
  },
  selectedLabel: { fontWeight: 'bold', color: '#444', marginBottom: 4 },
  selectedAddress: { color: '#222', fontSize: 15, marginBottom: 2 },
  selectedCoords: { color: '#888', fontSize: 13 },
  proceedBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    opacity: 1,
  },
  proceedBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default LocationPicker; 