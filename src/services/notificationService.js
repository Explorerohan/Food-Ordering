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
  }

  // Initialize notification service
  async initialize() {
    try {
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
          console.log('Local notifications will still work for testing');
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
      console.log('=== NOTIFICATION STATUS ===');
      console.log('Permission status:', status);
      console.log('Device is device:', Device.isDevice);
      console.log('Push token available:', !!this.expoPushToken);
      console.log('Notifications count:', this.notifications.length);
      console.log('==========================');
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
        await notificationApi.updatePushToken(this.expoPushToken);
        console.log('Push token sent to backend successfully');
        return true;
      } catch (error) {
        console.error('Failed to send push token to backend:', error);
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
    console.log('=== NOTIFICATION RECEIVED ===');
    console.log('Notification:', notification);
    console.log('Title:', notification.request.content.title);
    console.log('Body:', notification.request.content.body);
    console.log('Data:', notification.request.content.data);
    
    const notificationData = {
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      timestamp: new Date().toISOString(),
      read: false,
      type: notification.request.content.data?.type || 'general'
    };

    await this.addNotification(notificationData);
    console.log('=== NOTIFICATION PROCESSED ===');
  }

  // Handle notification tap
  async handleNotificationResponse(response) {
    console.log('Notification tapped:', response);
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
      console.log('Showing local notification:', { title, body, data });
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      console.log('Notification scheduled with ID:', notificationId);

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
      console.log('Notification added to local storage');
      return notificationId;
    } catch (error) {
      console.error('Error showing local notification:', error);
      throw error;
    }
  }

  // Show order confirmation notification
  async showOrderConfirmation(orderId, orderDetails) {
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
      // Merge backend notifications with local ones
      // This ensures we have all notifications from both sources
      for (const backendNotif of backendNotifications) {
        const existingIndex = this.notifications.findIndex(n => n.id === backendNotif.id);
        if (existingIndex === -1) {
          // Add new notification from backend
          this.notifications.unshift({
            id: backendNotif.id,
            title: backendNotif.title,
            body: backendNotif.body,
            data: backendNotif.data,
            timestamp: backendNotif.created_at,
            read: backendNotif.read,
            type: backendNotif.notification_type
          });
        }
      }
      await this.saveNotifications();
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  }

  // Add notification to local storage
  async addNotification(notificationData) {
    this.notifications.unshift(notificationData);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    await this.saveNotifications();
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

  // Send push notification (for testing)
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send test notification from backend
  async sendTestNotification() {
    try {
      await notificationApi.sendTestNotification();
      console.log('Test notification sent from backend');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 