// API Configuration - Centralized configuration for all API endpoints
// Change the IP address here to switch between different environments

// Base URLs
export const API_BASE_URL = 'http://192.168.1.90:8000';
export const WS_BASE_URL = 'ws://192.168.1.90:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/token/',
  REFRESH_TOKEN: '/api/token/refresh/',
  REGISTER: '/api/register/',
  CHANGE_PASSWORD: '/api/change-password/',
  FORGOT_PASSWORD: '/api/forgot-password/',
  RESET_PASSWORD: '/api/reset-password/',
  VERIFY_OTP: '/api/verify-otp/',
  
  // Profile
  PROFILE: '/api/profile/me/',
  
  // Food
  FOODS: '/foods/',
  CATEGORIES: '/categories/',
  
  // Cart
  CART: '/api/cart/',
  CART_CLEAR: '/api/cart/clear/',
  
  // Orders
  ORDERS: '/api/orders/',
  ORDER_CANCEL: '/api/orders/{id}/cancel/',
  
  // Reviews
  REVIEWS: '/api/reviews/',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications/',
  NOTIFICATION_MARK_READ: '/api/notifications/mark-read/{id}/',
  NOTIFICATION_MARK_ALL_READ: '/api/notifications/mark-all-read/',
  NOTIFICATION_STATS: '/api/notifications/stats/',
  PUSH_TOKEN: '/api/push-token/',
  NOTIFICATION_TOGGLE: '/api/notifications/toggle/',
  SEND_NOTIFICATION_TO_USER: '/api/notifications/send-to-user/',
  
  // Chat
  CHAT_WS: '/ws/chat/',
};

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (endpoint) => {
  return `${WS_BASE_URL}${endpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
}; 