import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Handle real-time notification updates
  const handleNotificationUpdate = (notificationData) => {
    console.log('📱 Notification context update triggered:', notificationData?.title);
    
    if (notificationData === null) {
      // All notifications marked as read
      console.log('📱 Marking all notifications as read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return;
    }
    
    setNotifications(prev => {
      // Check if notification already exists
      const existingIndex = prev.findIndex(n => n.id === notificationData.id);
      if (existingIndex !== -1) {
        // Update existing notification
        console.log('📱 Updating existing notification');
        const updated = [...prev];
        const wasUnread = !updated[existingIndex].read;
        updated[existingIndex] = notificationData;
        
        // Update unread count if status changed
        if (wasUnread && notificationData.read) {
          console.log('📱 Decreasing unread count (marked as read)');
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (!wasUnread && !notificationData.read) {
          console.log('📱 Increasing unread count (marked as unread)');
          setUnreadCount(prev => prev + 1);
        }
        
        return updated;
      } else {
        // Add new notification at the beginning
        console.log('📱 Adding new notification, current unread count:', unreadCount);
        if (!notificationData.read) {
          console.log('📱 Increasing unread count (new unread notification)');
          setUnreadCount(prev => prev + 1);
        }
        return [notificationData, ...prev];
      }
    });
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      // Immediately update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Immediately update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const addNotification = async (notificationData) => {
    try {
      await notificationService.addNotification(notificationData);
      setNotifications(prev => [notificationData, ...prev]);
      if (!notificationData.read) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const showOrderConfirmation = async (orderId, orderDetails) => {
    try {
      await notificationService.showOrderConfirmation(orderId, orderDetails);
      // No need to fetch notifications - real-time updates handle this
    } catch (error) {
      console.error('Error showing order confirmation:', error);
    }
  };

  const showPaymentSuccess = async (orderId, amount) => {
    try {
      await notificationService.showPaymentSuccess(orderId, amount);
      // No need to fetch notifications - real-time updates handle this
    } catch (error) {
      console.error('Error showing payment success:', error);
    }
  };

  const showOrderStatusUpdate = async (orderId, status, message) => {
    try {
      await notificationService.showOrderStatusUpdate(orderId, status, message);
      // No need to fetch notifications - real-time updates handle this
    } catch (error) {
      console.error('Error showing order status update:', error);
    }
  };

  useEffect(() => {
    const initializeNotificationSystem = async () => {
      try {
        // Initialize notification service first
        await notificationService.initialize();
        console.log('Notification service initialized in context');
        
        // Set up real-time notification callback
        notificationService.setNotificationUpdateCallback(handleNotificationUpdate);
        console.log('Notification callback set up in context');
        
        // Send push token to backend
        await notificationService.sendPushTokenToBackend();
        console.log('Push token sent to backend');
        
        // Fetch existing notifications
        await fetchNotifications();
      } catch (error) {
        console.error('Error initializing notification system:', error);
      }
    };

    initializeNotificationSystem();
    
    // Cleanup callback when component unmounts
    return () => {
      notificationService.setNotificationUpdateCallback(null);
    };
  }, []);

  // Debug: Log unread count changes
  useEffect(() => {
    console.log('🔢 Unread count updated:', unreadCount);
  }, [unreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    addNotification,
    showOrderConfirmation,
    showPaymentSuccess,
    showOrderStatusUpdate,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 