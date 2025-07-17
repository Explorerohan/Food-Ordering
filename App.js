import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
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
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import MapScreen from './src/screens/MapScreen';
import CheckoutFormScreen from './src/screens/CheckoutFormScreen';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SystemNavigationBar from 'react-native-system-navigation-bar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

LogBox.ignoreLogs([
  "The action 'RESET' with payload",
]);

function MainTabs({ username, email, phoneNumber, profilePicture, bio, onLogout, navigation, onRefreshProfile }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          else if (route.name === 'Cart') iconName = 'cart-outline';
          else if (route.name === 'MyOrders') iconName = 'bag-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
      })}
    >
      <Tab.Screen name="Home">
        {props => <DashboardScreen {...props} username={username} />}
      </Tab.Screen>
      <Tab.Screen name="MyOrders" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Cart" component={CartDetails} />
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} username={username} email={email} phoneNumber={phoneNumber} profilePicture={profilePicture} bio={bio} onLogout={(nav) => onLogout(nav || props.navigation)} navigation={props.navigation} onRefreshProfile={onRefreshProfile} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const auth = useRef();

  const fetchAndStoreProfileDetails = async (token) => {
    try {
      if (!token || token.trim() === '') {
        throw new Error('No valid token provided');
      }
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
        setPhoneNumber(data.phone_number || '');
        await AsyncStorage.setItem(`phoneNumber_${id}`, data.phone_number || '');
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
            setIsAuthenticated(false);
            setUsername('');
            setEmail('');
            setProfilePicture(null);
            setUserId(null);
            setBio('');
            setPhoneNumber('');
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

  useEffect(() => {
    SystemNavigationBar.setNavigationColor('transparent');
  }, []);

  const handleLogin = async (usernameInput, password, navigation) => {
    try {
      const res = await authApi.login(usernameInput, password);
      const token = res.access;
      const refresh = res.refresh;
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('refreshToken', refresh);
      // Fetch user profile
      const profileRes = await fetch('http://192.168.1.90:8000/api/profile/me/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await profileRes.json();
      const userData = {
        id: data.user?.id,
        username: data.user?.username,
        is_admin: data.user?.is_admin || false,
      };
      // Save user in AuthContext
      auth.current.login(userData, token);
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

  const handleSignup = async (username, emailInput, phoneNumber, password, navigation) => {
    try {
      await authApi.signup(username, emailInput, phoneNumber, password);
      // Show success message and redirect to login
      Alert.alert(
        'Account Created Successfully!', 
        'Your account has been created. Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              if (navigation && navigation.reset) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else if (navigation && navigation.navigate) {
                navigation.navigate('Login');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Signup Failed', 'Failed to create account. Please try again.');
    }
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
        key === 'refreshToken' ||
        key.startsWith('phoneNumber_')
    );
    await AsyncStorage.multiRemove(userKeys);
    setIsAuthenticated(false);
    setUsername('');
    setEmail('');
    setProfilePicture(null);
    setUserId(null);
    setBio('');
    setPhoneNumber('');
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
    <AuthProvider>
      <AuthContext.Consumer>
        {context => {
          auth.current = context;
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
                    <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                      {props => <MainTabs {...props} username={username} email={email} phoneNumber={phoneNumber} profilePicture={profilePicture} bio={bio} onLogout={handleLogout} navigation={props.navigation} onRefreshProfile={fetchAndStoreProfileDetails} />}
                    </Stack.Screen>
                    <Stack.Screen name="FoodDetailScreen" component={FoodDetailScreen} />
                    <Stack.Screen name="EditProfile">
                      {props => <EditProfileScreen {...props} onProfileUpdate={fetchAndStoreProfileDetails} />}
                    </Stack.Screen>
                    <Stack.Screen name="CartDetails" component={CartDetails} />
                    <Stack.Screen name="OrderConfirmationScreen" component={OrderConfirmationScreen} />
                    <Stack.Screen name="OrderHistoryScreen" component={OrderHistoryScreen} />
                    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                    <Stack.Screen name="MapScreen" component={MapScreen} />
                    <Stack.Screen name="CheckoutFormScreen" component={CheckoutFormScreen} />
                    <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: 'Live Chat' }} />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          );
        }}
      </AuthContext.Consumer>
    </AuthProvider>
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
