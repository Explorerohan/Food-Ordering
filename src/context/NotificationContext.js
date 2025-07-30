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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      await fetchNotifications(); // Refresh to get updated count
    } catch (error) {
      console.error('Error showing order confirmation:', error);
    }
  };

  const showPaymentSuccess = async (orderId, amount) => {
    try {
      await notificationService.showPaymentSuccess(orderId, amount);
      await fetchNotifications(); // Refresh to get updated count
    } catch (error) {
      console.error('Error showing payment success:', error);
    }
  };

  const showOrderStatusUpdate = async (orderId, status, message) => {
    try {
      await notificationService.showOrderStatusUpdate(orderId, status, message);
      await fetchNotifications(); // Refresh to get updated count
    } catch (error) {
      console.error('Error showing order status update:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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