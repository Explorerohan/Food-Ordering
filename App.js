import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from './src/screens/DashboardScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import { authApi } from './src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Button, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, SafeAreaView, Image, Alert, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import CartDetails from './src/screens/CartDetails';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

LogBox.ignoreLogs([
  "The action 'RESET' with payload",
]);

function ProfileScreen({ username, email, profilePicture, bio, onLogout, navigation, onRefreshProfile }) {
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token && onRefreshProfile) {
          await onRefreshProfile(token);
        }
      };
      refreshProfile();
    }, [onRefreshProfile])
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* StatusBar for ProfileScreen */}
      <StatusBar style="light" />
      {/* Header Section */}
      <View style={{ backgroundColor: '#FF9800', paddingBottom: 24, paddingTop: 40 + (StatusBar.currentHeight || 0), paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 2, marginLeft: -12 }}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: 'bold', letterSpacing: 0.2, marginLeft: 8 }}>
            My Profile
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#fff', marginRight: 18, backgroundColor: '#fff' }} />
        ) : (
            <Ionicons name="person-circle-outline" size={84} color="#fff" style={{ marginRight: 18 }} />
        )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.1 }}>{username}</Text>
            {email ? (
              <Text style={{ color: '#ffe0b2', fontSize: 14, marginTop: 2 }} numberOfLines={1}>{email}</Text>
            ) : null}
            {bio ? (
              <Text style={{ color: '#ffe0b2', fontSize: 13, marginTop: 2 }} numberOfLines={2}>{bio}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ marginLeft: 8, padding: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Ionicons name="pencil" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Menu section */}
      <View style={{ backgroundColor: '#fff', flex: 1, marginTop: 8, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }}>
        <MenuItem icon="card-outline" label="Payment Method" onPress={() => {}} />
        <MenuItem icon="gift-outline" label="My Promocodes" onPress={() => {}} />
        <MenuItem icon="heart-outline" label="My Orders" onPress={() => navigation.navigate('MyOrders')} />
        <MenuItem icon="map-outline" label="Track your order" onPress={() => {}} />
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={() => onLogout(navigation)} color="#FF6B35" />
      </View>
    </View>
  );
}

// Add placeholder MyOrdersScreen if not already defined
const MyOrdersScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>My Orders Screen</Text>
  </View>
);

// Add placeholder component for Chat if not already defined
const ChatScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Chat Screen</Text>
  </View>
);

function MainTabs({ username, email, profilePicture, bio, onLogout, navigation, onRefreshProfile }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          else if (route.name === 'Cart') iconName = 'cart-outline';
          else if (route.name === 'MyOrders') iconName = 'bag-outline';
          else if (route.name === 'Chat') iconName = 'chatbubble-ellipses-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {props => <DashboardScreen {...props} username={username} />}
      </Tab.Screen>
      <Tab.Screen name="MyOrders" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Cart" component={CartDetails} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} username={username} email={email} profilePicture={profilePicture} bio={bio} onLogout={(nav) => onLogout(nav || props.navigation)} navigation={props.navigation} onRefreshProfile={onRefreshProfile} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Add MenuItem component below ProfileScreen
function MenuItem({ icon, label, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f6f6f6', backgroundColor: '#fff' }}>
      <Ionicons name={icon} size={24} color={color || '#555'} style={{ width: 28 }} />
      <Text style={{ marginLeft: 18, fontSize: 16.5, color: color || '#222', flex: 1, fontWeight: '500', letterSpacing: 0.1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={22} color="#bbb" />
    </TouchableOpacity>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch and store user profile details by userId
  const fetchAndStoreProfileDetails = async (token) => {
    try {
      // Check if token exists and is valid
      if (!token || token.trim() === '') {
        throw new Error('No valid token provided');
      }
      
      // Add a timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000); // 7 seconds
              const res = await fetch('http://192.168.1.90:8000/api/profile/me/', {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Profile fetch failed');
      const data = await res.json();
      const id = data.user?.id;
      if (id) {
        setUserId(id);
        await AsyncStorage.setItem('userId', id.toString());
        if (data.user?.username) {
          setUsername(data.user.username);
          await AsyncStorage.setItem(`username_${id}`, data.user.username);
        }
        if (data.user?.email) {
          setEmail(data.user.email);
          await AsyncStorage.setItem(`email_${id}`, data.user.email);
        }
        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
          await AsyncStorage.setItem(`profilePicture_${id}`, data.profile_picture);
        } else {
          setProfilePicture(null);
          await AsyncStorage.removeItem(`profilePicture_${id}`);
        }
        setBio(data.bio || '');
        await AsyncStorage.setItem(`bio_${id}`, data.bio || '');
      }
    } catch (e) {
      console.log('Failed to fetch/store profile details:', e);
      throw e;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          try {
            await fetchAndStoreProfileDetails(token);
            setIsAuthenticated(true);
          } catch (e) {
            // Token invalid or profile fetch failed
            setIsAuthenticated(false);
            setUsername('');
            setEmail('');
            setProfilePicture(null);
            setUserId(null);
            setBio('');
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = async (usernameInput, password, navigation) => {
    try {
      const res = await authApi.login(usernameInput, password);
      const token = res.access;
      const refresh = res.refresh;
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('refreshToken', refresh);
      await fetchAndStoreProfileDetails(token);
      setIsAuthenticated(true);
      if (navigation && navigation.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else if (navigation && navigation.navigate) {
        navigation.navigate('MainTabs');
      }
    } catch (e) {
      setIsAuthenticated(false);
      Alert.alert('Login Failed', 'Invalid credentials or network error.');
    }
  };

  const handleSignup = async (username, emailInput, password, navigation) => {
    await authApi.signup(username, emailInput, password);
    await handleLogin(username, password, navigation);
  };

  const handleLogout = async (navigation) => {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(
      key =>
        key.startsWith('username_') ||
        key.startsWith('email_') ||
        key.startsWith('profilePicture_') ||
        key === 'userId' ||
        key === 'authToken' ||
        key === 'accessToken' ||
        key === 'refreshToken'
    );
    await AsyncStorage.multiRemove(userKeys);
    setIsAuthenticated(false);
    setUsername('');
    setEmail('');
    setProfilePicture(null);
    setUserId(null);
    setBio('');
    if (navigation && navigation.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" >
              {props => <LoginScreen {...props} onLogin={(...args) => handleLogin(...args, props.navigation)} />}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {props => <SignupScreen {...props} onSignup={(...args) => handleSignup(...args, props.navigation)} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {props => <MainTabs {...props} username={username} email={email} profilePicture={profilePicture} bio={bio} onLogout={(nav) => handleLogout(nav || props.navigation)} navigation={props.navigation} onRefreshProfile={fetchAndStoreProfileDetails} />}
            </Stack.Screen>
            <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
            <Stack.Screen name="EditProfile">
              {props => <EditProfileScreen {...props} onProfileUpdate={fetchAndStoreProfileDetails} />}
            </Stack.Screen>
            <Stack.Screen name="CartDetails" component={CartDetails} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginBottom: 10,
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: 'gray',
    marginTop: 5,
  },
  profileBio: {
    fontSize: 15,
    color: '#444',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  menuContainer: {
    width: '90%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 18,
    color: '#333',
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
