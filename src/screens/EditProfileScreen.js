import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../services/api';

const API_URL = 'http://192.168.1.148:8000/api/profile/';

const EditProfileScreen = ({ navigation, onProfileUpdate }) => {
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileId, setProfileId] = useState(null);

  // Fetch profile every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const refreshAccessToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem('refreshToken');
      if (!refresh) throw new Error('No refresh token found');
              const response = await fetch('http://192.168.1.148:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) throw new Error('Failed to refresh token');
      const data = await response.json();
      if (data.access) {
        await AsyncStorage.setItem('accessToken', data.access);
        return data.access;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (e) {
      console.log('Error refreshing token:', e);
      throw e;
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem('accessToken');
      let data;
      try {
        data = await profileApi.getProfile(token);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          token = await refreshAccessToken();
          data = await profileApi.getProfile(token);
        } else {
          throw err;
        }
      }
      setUsername(data.user?.username || '');
      setEmail(data.user?.email || '');
      setBio(data.bio || '');
      setProfileImage(data.profile_picture || null);
      setProfileId(data.id);
    } catch (e) {
      console.log('Error in fetchProfile:', e);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Submitting profile update with data:', { username, email, bio, profileImage });
      console.log('Token:', token ? 'Present' : 'Missing');
      await profileApi.updateProfile({ username, email, bio, profileImage }, token);
      
      // Update AsyncStorage with new values immediately
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await AsyncStorage.setItem(`username_${userId}`, username);
        await AsyncStorage.setItem(`email_${userId}`, email);
        await AsyncStorage.setItem(`bio_${userId}`, bio || '');
        if (profileImage) {
          await AsyncStorage.setItem(`profilePicture_${userId}`, profileImage);
        }
      }
      
      // Call the callback to refresh profile data in parent component
      if (onProfileUpdate) {
        await onProfileUpdate(token);
      }
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={{ color: '#aaa' }}>Pick Image</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveButtonText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
  imagePicker: {
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#222',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backArrow: {
    position: 'absolute',
    top: 40,
    left: 5,
    zIndex: 10,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
});

export default EditProfileScreen; 