# 🔔 Notification System Integration Guide

## Overview
This guide shows you how to integrate the notification system with your React Native/Expo app.

## 🚀 Quick Start

### 1. **Initialize Notifications (App.js)**
```javascript
import notificationService from './src/services/notificationService';

// In your App.js or main component
useEffect(() => {
  const initNotifications = async () => {
    await notificationService.initialize();
  };
  
  initNotifications();
}, []);
```

### 2. **Send Push Token After Login**
```javascript
// In your login success handler
const handleLoginSuccess = async (userData) => {
  // ... other login logic
  
  // Send push token to backend
  await notificationService.sendPushTokenToBackend();
};
```

## 📱 Usage Examples

### **Send Order Confirmation**
```javascript
import { NotificationHelper } from './src/services/notificationHelper';

// When order is placed
const handleOrderPlaced = async (orderData) => {
  try {
    await NotificationHelper.sendOrderConfirmation(
      orderData.user_id,
      orderData.order_id,
      orderData
    );
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
  }
};
```

### **Send Order Status Update**
```javascript
// When order status changes
const handleOrderStatusUpdate = async (orderId, userId, status) => {
  const statusMessages = {
    'preparing': 'Chef is preparing your order! 👨‍🍳',
    'ready': 'Your order is ready for pickup! 📦',
    'out_for_delivery': 'Your order is on the way! 🚚',
    'delivered': 'Order delivered! Enjoy your meal! ✅'
  };
  
  try {
    await NotificationHelper.sendOrderStatusUpdate(
      userId,
      orderId,
      status,
      statusMessages[status]
    );
  } catch (error) {
    console.error('Failed to send status update:', error);
  }
};
```

### **Send Payment Success**
```javascript
// When payment is successful
const handlePaymentSuccess = async (orderId, userId, amount, method) => {
  try {
    await NotificationHelper.sendPaymentSuccess(
      userId,
      orderId,
      amount,
      method
    );
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }
};
```

### **Send Welcome Message**
```javascript
// When user registers
const handleUserRegistration = async (userData) => {
  try {
    await NotificationHelper.sendWelcomeNotification(
      userData.id,
      userData.username
    );
  } catch (error) {
    console.error('Failed to send welcome notification:', error);
  }
};
```

## 🔧 Integration Points

### **1. Order System Integration**
```javascript
// In your order creation API
const createOrder = async (orderData) => {
  try {
    // Create order
    const order = await orderApi.createOrder(orderData);
    
    // Send confirmation notification
    await NotificationHelper.sendOrderConfirmation(
      orderData.user_id,
      order.id,
      order
    );
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

### **2. Payment System Integration**
```javascript
// In your payment success handler
const handlePaymentSuccess = async (paymentData) => {
  try {
    // Process payment
    const payment = await paymentApi.processPayment(paymentData);
    
    // Send payment notification
    await NotificationHelper.sendPaymentSuccess(
      paymentData.user_id,
      paymentData.order_id,
      payment.amount,
      payment.method
    );
    
    return payment;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
```

### **3. Delivery System Integration**
```javascript
// In your delivery status update
const updateDeliveryStatus = async (orderId, userId, status) => {
  try {
    // Update delivery status
    await deliveryApi.updateStatus(orderId, status);
    
    // Send delivery notification
    await NotificationHelper.sendDeliveryUpdate(
      userId,
      orderId,
      `Your order status: ${status}`
    );
  } catch (error) {
    console.error('Error updating delivery status:', error);
    throw error;
  }
};
```

## 📋 Available Helper Functions

### **NotificationHelper Methods:**
- `sendOrderConfirmation(userId, orderId, orderDetails)`
- `sendOrderStatusUpdate(userId, orderId, status, message)`
- `sendPaymentSuccess(userId, orderId, amount, paymentMethod)`
- `sendDeliveryUpdate(userId, orderId, message)`
- `sendGeneralNotification(userId, title, body, data)`
- `sendWelcomeNotification(userId, username)`
- `sendPromotionalNotification(userId, title, body, offerData)`

## 🔄 Real-time Updates

### **Setup Notification Context**
```javascript
import { NotificationContext } from './src/context/NotificationContext';

// In your app
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  // Set callback for real-time updates
  notificationService.setNotificationUpdateCallback((notification) => {
    if (notification) {
      setNotifications(prev => [notification, ...prev]);
    } else {
      // Refresh all notifications
      loadNotifications();
    }
  });
}, []);
```

### **Load Notifications**
```javascript
const loadNotifications = async () => {
  try {
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
};
```

## 🎯 Best Practices

### **1. Error Handling**
```javascript
const sendNotificationSafely = async (notificationFunction, ...args) => {
  try {
    await notificationFunction(...args);
  } catch (error) {
    console.error('Notification failed:', error);
    // Don't let notification errors break your main flow
  }
};
```

### **2. User Preferences**
```javascript
const checkAndSendNotification = async (notificationFunction, ...args) => {
  const notificationsEnabled = await notificationService.checkNotificationsEnabled();
  
  if (notificationsEnabled) {
    await sendNotificationSafely(notificationFunction, ...args);
  }
};
```

### **3. Batch Notifications**
```javascript
const sendBatchNotifications = async (notifications) => {
  const promises = notifications.map(notification => 
    sendNotificationSafely(NotificationHelper.sendGeneralNotification, ...notification)
  );
  
  await Promise.allSettled(promises);
};
```

## 🔒 Security Considerations

- **Authentication Required**: All notification endpoints require valid JWT token
- **User Validation**: Only send notifications to valid users
- **Rate Limiting**: Consider implementing rate limiting for bulk notifications
- **Error Handling**: Always handle notification errors gracefully

## 📊 Testing

### **Test Notification Sending**
```javascript
// Test sending a notification
const testNotification = async () => {
  try {
    const result = await NotificationHelper.sendGeneralNotification(
      123, // user_id
      "Test Notification",
      "This is a test notification",
      { test: true }
    );
    console.log('Test notification sent:', result);
  } catch (error) {
    console.error('Test notification failed:', error);
  }
};
```

## 🎉 Benefits

1. **Easy Integration**: Simple helper functions for common use cases
2. **Type Safety**: Proper notification types and data structures
3. **Error Handling**: Comprehensive error handling and logging
4. **Real-time Updates**: Live notification updates in your app
5. **Platform Agnostic**: Works with any frontend platform
6. **Production Ready**: Clean, tested, and reliable code

Your notification system is now fully integrated and ready to use! 🚀 