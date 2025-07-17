import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { profileApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

function ProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          let data = await profileApi.getProfile();
          setUsername(data.user?.username || '');
          setEmail(data.user?.email || '');
          setPhoneNumber(data.phone_number || '');
          setProfilePicture(data.profile_picture || null);
          setBio(data.bio || '');
        } catch (e) {
          Alert.alert('Error', 'Failed to load profile.');
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      <StatusBar style="dark" />
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.profileRow}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={84} color="#bbb" style={{ marginRight: 18 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{username}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
            {phoneNumber ? <Text style={styles.phone}>{phoneNumber}</Text> : null}
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
            <Ionicons name="pencil" size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Menu section */}
      <View style={styles.menuSection}>
        <MenuItem icon="card-outline" label="Payment Method" onPress={() => {}} />
        <MenuItem icon="gift-outline" label="My Promocodes" onPress={() => {}} />
        <MenuItem icon="heart-outline" label="My Orders" onPress={() => navigation.navigate('MyOrders')} />
        <MenuItem icon="map-outline" label="Track your order" onPress={() => {}} />
        <MenuItem icon="chatbubble-ellipses-outline" label="24 hrs Support" onPress={() => navigation.navigate('ChatScreen')} color="#2196F3" />
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} color="#FF6B35" />
      </View>
    </SafeAreaViewContext>
  );
}

function MenuItem({ icon, label, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
      <Ionicons name={icon} size={24} color={color || '#555'} style={{ width: 28 }} />
      <Text style={[styles.menuLabel, color ? { color } : null]}>{label}</Text>
      <Ionicons name="chevron-forward" size={22} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingTop: 0,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
  },
  backBtn: {
    marginRight: 2,
    marginLeft: -12,
  },
  headerTitle: {
    color: '#222',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#eee',
    marginRight: 18,
    backgroundColor: '#fff',
  },
  username: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.1,
  },
  email: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  phone: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  editBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  menuSection: {
    backgroundColor: '#fff',
    flex: 1,
    marginTop: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
    backgroundColor: '#fff',
  },
  menuLabel: {
    marginLeft: 18,
    fontSize: 16.5,
    color: '#222',
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

export default ProfileScreen; 