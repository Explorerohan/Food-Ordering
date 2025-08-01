import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { notificationApi } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, 
  }),
});

class NotificationService {
  constructor() {
    this.notifications = [];
    this.expoPushToken = null;
    this.onNotificationUpdate = null; // Callback for real-time updates
  }

  // Set callback for notification updates
  setNotificationUpdateCallback(callback) {
    this.onNotificationUpdate = callback;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Clear any existing notifications on app start (in case of user switch)
      this.notifications = [];
      await this.saveNotifications();
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token (only works in development builds, not Expo Go)
      if (Device.isDevice) {
        try {
          this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
            projectId: 'aed3e271-2837-4604-9248-869713ae6cbb', // Your Expo project ID
          })).data;
          console.log('Expo push token:', this.expoPushToken);
          
          // Store push token locally - will send to backend when user logs in
          await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
        } catch (error) {
          console.log('Push token not available (likely using Expo Go):', error.message);
        }
      }

      // Load existing notifications from storage
      await this.loadNotifications();

      // Set up notification listener
      this.setupNotificationListener();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Check notification permissions and status
  async checkNotificationStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return 'unknown';
    }
  }

  // Send push token to backend (call this after user logs in)
  async sendPushTokenToBackend() {
    if (!this.expoPushToken) {
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      if (storedToken) {
        this.expoPushToken = storedToken;
      }
    }

    if (this.expoPushToken) {
      try {
        // Clear existing notifications before syncing with new user
        await this.clearLocalNotifications();
        
        // Send push token to backend
        await notificationApi.updatePushToken(this.expoPushToken);
        console.log('Push token sent to backend successfully');
        
        // Sync notifications with backend
        await this.syncWithBackend();
        
        return true;
      } catch (error) {
        console.error('Error sending push token to backend:', error);
        return false;
      }
    }
    return false;
  }

  // Set up notification listener
  setupNotificationListener() {
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived.bind(this));
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));
  }

  // Handle received notification
  async handleNotificationReceived(notification) {
    console.log('🔔 Push notification received:', notification.request.content.title);
    
    const notificationData = {
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      timestamp: new Date().toISOString(),
      read: false,
      type: notification.request.content.data?.type || 'general'
    };

    console.log('📝 Adding notification to local storage:', notificationData);
    await this.addNotification(notificationData);
    
    // Immediately notify context about the new notification
    if (this.onNotificationUpdate) {
      console.log('🔄 Triggering notification callback');
      this.onNotificationUpdate(notificationData);
    } else {
      console.log('⚠️ No notification callback set up');
    }
  }

  // Handle notification tap
  async handleNotificationResponse(response) {
    const notificationId = response.notification.request.identifier;
    
    // Mark as read
    await this.markAsRead(notificationId);
    
    // Handle navigation based on notification type
    const data = response.notification.request.content.data;
    if (data?.orderId) {
      // Navigate to order details
      return { type: 'order', orderId: data.orderId };
    }
    
    return { type: 'general' };
  }

  // Show local notification
  async showLocalNotification(title, body, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      const notificationData = {
        id: notificationId,
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
        read: false,
        type: data.type || 'general'
      };

      await this.addNotification(notificationData);
      
      // Notify context about the new notification immediately
      if (this.onNotificationUpdate) {
        this.onNotificationUpdate(notificationData);
      }
      
      return notificationId;
    } catch (error) {
      console.error('Error showing local notification:', error);
      throw error;
    }
  }

  // Show order confirmation notification
  async showOrderConfirmation(orderId, orderDetails) {
    // Check if notifications are enabled
    const notificationsEnabled = await this.checkNotificationsEnabled();
    if (!notificationsEnabled) {
      return false;
    }

    const title = `Order Confirmed! 🎉`;
    const body = `Your order #${orderId} has been placed successfully. We'll notify you when it's ready!`;
    
    return await this.showLocalNotification(title, body, {
      type: 'order_confirmation',
      orderId: orderId.toString(),
      orderDetails
    });
  }

  // Show order status update notification
  async showOrderStatusUpdate(orderId, status, message) {
    // Check if notifications are enabled
    const notificationsEnabled = await this.checkNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('Notifications disabled - skipping order status update notification');
      return false;
    }

    const statusEmojis = {
      'preparing': '👨‍🍳',
      'out_for_delivery': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };

    const emoji = statusEmojis[status] || '📦';
    const title = `Order #${orderId} ${emoji}`;
    const body = message;

    return await this.showLocalNotification(title, body, {
      type: 'order_status',
      orderId: orderId.toString(),
      status
    });
  }

  // Show payment success notification
  async showPaymentSuccess(orderId, amount) {
    // Check if notifications are enabled
    const notificationsEnabled = await this.checkNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('Notifications disabled - skipping payment success notification');
      return false;
    }

    const title = `Payment Successful! 💳`;
    const body = `Payment of ₹${amount} for order #${orderId} has been completed.`;
    
    return await this.showLocalNotification(title, body, {
      type: 'payment_success',
      orderId: orderId.toString(),
      amount
    });
  }

  // Sync notifications with backend
  async syncWithBackend() {
    try {
      const backendNotifications = await notificationApi.getNotifications();
      // Replace local notifications with backend notifications (user-specific)
      this.notifications = backendNotifications.map(backendNotif => ({
        id: backendNotif.id,
        title: backendNotif.title,
        body: backendNotif.body,
        data: backendNotif.data,
        timestamp: backendNotif.created_at,
        read: backendNotif.read,
        type: backendNotif.notification_type
      }));
      await this.saveNotifications();
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  }

  // Clear local notifications (call this when user logs out)
  async clearLocalNotifications() {
    this.notifications = [];
    await this.saveNotifications();
    await Notifications.dismissAllNotificationsAsync();
  }

  // Add notification to local storage
  async addNotification(notificationData) {
    // Check if notification with same ID already exists
    const existingIndex = this.notifications.findIndex(n => n.id === notificationData.id);
    if (existingIndex !== -1) {
      // Update existing notification instead of adding duplicate
      this.notifications[existingIndex] = notificationData;
    } else {
      // Add new notification at the beginning
      this.notifications.unshift(notificationData);
    }
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    await this.saveNotifications();
    
    // Notify context about the update
    if (this.onNotificationUpdate) {
      this.onNotificationUpdate(notificationData);
    }
  }

  // Get all notifications
  async getNotifications() {
    await this.loadNotifications();
    return this.notifications;
  }

  // Get unread notifications count
  async getUnreadCount() {
    await this.loadNotifications();
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      
      // Notify context about the update
      if (this.onNotificationUpdate) {
        this.onNotificationUpdate(notification);
      }
      
      // Also mark as read on backend
      try {
        await notificationApi.markAsRead(notificationId);
      } catch (error) {
        console.error('Error marking as read on backend:', error);
      }
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    
    // Notify context about the update (send null to indicate all marked as read)
    if (this.onNotificationUpdate) {
      this.onNotificationUpdate(null);
    }
    
    // Also mark all as read on backend
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read on backend:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    this.notifications = [];
    await this.saveNotifications();
    await Notifications.dismissAllNotificationsAsync();
  }

  // Save notifications to AsyncStorage
  async saveNotifications() {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Load notifications from AsyncStorage
  async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  // Get push token
  getPushToken() {
    return this.expoPushToken;
  }

  // Check if notifications are enabled for the user
  async checkNotificationsEnabled() {
    try {
      // First check local storage for cached setting
      const cachedSetting = await AsyncStorage.getItem('notificationsEnabled');
      if (cachedSetting !== null) {
        return JSON.parse(cachedSetting);
      }

      // If not cached, check with backend
      try {
        const response = await notificationApi.getNotificationStats();
        const enabled = response.notifications_enabled;
        // Cache the setting
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
        return enabled;
      } catch (error) {
        // Default to enabled if we can't check
        return true;
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
      return true; // Default to enabled
    }
  }

  // Update notification setting (toggle on/off)
  async updateNotificationSetting(enabled) {
    try {
      // Update on backend
      await notificationApi.toggleNotifications(enabled);
      
      // Update local cache
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
      
      console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService; 