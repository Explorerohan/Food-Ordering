import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

function ProfileScreen({ username, email, phoneNumber, profilePicture, bio, onLogout, navigation, onRefreshProfile }) {
  useFocusEffect(
    React.useCallback(() => {
      if (onRefreshProfile) {
        onRefreshProfile();
      }
    }, [onRefreshProfile])
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="light" />
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.profileRow}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={84} color="#fff" style={{ marginRight: 18 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{username}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
            {phoneNumber ? <Text style={styles.phone}>{phoneNumber}</Text> : null}
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
            <Ionicons name="pencil" size={22} color="#fff" />
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
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={() => onLogout(navigation)} color="#FF6B35" />
      </View>
    </View>
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
    backgroundColor: '#FF9800',
    paddingBottom: 24,
    paddingTop: 56,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    marginRight: 2,
    marginLeft: -12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 18,
    backgroundColor: '#fff',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.1,
  },
  email: {
    color: '#ffe0b2',
    fontSize: 14,
    marginTop: 2,
  },
  phone: {
    color: '#ffe0b2',
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: '#ffe0b2',
    fontSize: 13,
    marginTop: 2,
  },
  editBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  menuSection: {
    backgroundColor: '#fff',
    flex: 1,
    marginTop: 8,
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