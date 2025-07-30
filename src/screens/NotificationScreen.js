import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useNotifications } from '../context/NotificationContext';
import notificationService from '../services/notificationService';

const NotificationScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.data?.orderId) {
      navigation.navigate('OrderDetail', { orderId: notification.data.orderId });
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      const success = await notificationService.sendLocalTestNotification();
      if (success) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_confirmation':
        return { name: 'checkmark-circle', color: '#4CAF50' };
      case 'order_status':
        return { name: 'restaurant', color: '#FF6B35' };
      case 'payment_success':
        return { name: 'card', color: '#2196F3' };
      default:
        return { name: 'notifications', color: '#666' };
    }
  };

  const getNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon.name} size={24} color={icon.color} />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationTime}>
                {getNotificationTime(item.timestamp)}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody}>{item.body}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContentRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
            <Ionicons name="checkmark-done" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTestNotification} style={styles.headerButton}>
            <Ionicons name="bug-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaViewContext style={styles.container} edges={["top","left","right"]}>
      <StatusBar style="dark" />
      {renderHeader()}
      <View style={styles.contentContainer}>
        {notifications.length === 0 ? (
          <View style={styles.emptyNotifications}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
            <Text style={styles.emptyNotificationsSubtext}>
              You'll see order updates and important messages here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6B35']}
                tintColor="#FF6B35"
              />
            }
          />
        )}
      </View>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  header: {
    width: '100%',
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
    flex: 1,
  },
  backArrow: {
    marginRight: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadNotification: {
    backgroundColor: '#FFF8F5',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 52,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyNotificationsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen; 