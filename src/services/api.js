import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../config/apiConfig';

// Base API configuration

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout to 60 seconds for email sending
  headers: {
    'Content-Type': 'application/json',
  },
});

// Food API service
export const foodApi = {
  // Get all food items
  getAllFoodItems: async (queryParams = null) => {
    try {
      let url = '/foods/';
      if (queryParams) {
        url += '?' + queryParams.toString();
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching food items:', error);
      throw error;
    }
  },

  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get food items by category
  getFoodItemsByCategory: async (category) => {
    try {
      const response = await api.get(`/foods/?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food items by category:', error);
      throw error;
    }
  },

  // Get food item by ID
  getFoodItemById: async (id) => {
    try {
      const response = await api.get(`/foods/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food item by ID:', error);
      throw error;
    }
  },
};

// Add reviews API
export const reviewsApi = {
  getReviewsByFoodId: async (foodId) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.get(`${API_ENDPOINTS.REVIEWS}?food_item=${foodId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching reviews:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  postReview: async (reviewData) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const headers = { Authorization: `Bearer ${accessToken}` };
        // Use axios.post directly for FormData to avoid base config issues
        const response = await axios.post(
          getApiUrl(API_ENDPOINTS.REVIEWS),
          reviewData,
          { headers }
        );
        return response.data;
      });
    } catch (error) {
      console.error('Error posting review:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Add authentication API
export const authApi = {
  login: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, { username, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  signup: async (username, email, phoneNumber, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, { username, email, phone_number: phoneNumber, password });
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  refreshToken: async (refresh) => {
    try {
      const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, { refresh });
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.put(API_ENDPOINTS.CHANGE_PASSWORD, {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  forgotPassword: async (email) => {
    try {
      console.log('Sending forgot password request for email:', email);
      const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email: email,
      });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, {
        email: email,
        otp: otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post(API_ENDPOINTS.VERIFY_OTP, {
        email: email,
        otp: otp,
      });
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },
};

// Profile API service
export const profileApi = {
  getProfile: async () => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.get(API_ENDPOINTS.PROFILE, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching profile:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  updateProfile: async ({ username, email, bio, profileImage, phoneNumber }) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        console.log('API: Updating profile with data:', { username, email, bio, phoneNumber });
        const formData = new FormData();
        formData.append('bio', bio);
        formData.append('user[username]', username);
        formData.append('user[email]', email);
        formData.append('phone_number', phoneNumber);
        if (profileImage && profileImage.startsWith('file')) {
          formData.append('profile_picture', {
            uri: profileImage,
            name: 'profile.jpg',
            type: 'image/jpeg',
          });
        }
        const response = await axios.patch(
          getApiUrl(API_ENDPOINTS.PROFILE),
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data;
      });
    } catch (error) {
      console.error('Error updating profile:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Add notification API
export const notificationApi = {
  // Get all notifications for current user
  getNotifications: async () => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const url = API_ENDPOINTS.NOTIFICATION_MARK_READ.replace('{id}', notificationId);
        const response = await api.post(url, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.post(API_ENDPOINTS.NOTIFICATION_MARK_ALL_READ, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Get notification statistics
  getNotificationStats: async () => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.get(API_ENDPOINTS.NOTIFICATION_STATS, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Update push token
  updatePushToken: async (pushToken) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.post(API_ENDPOINTS.PUSH_TOKEN, {
          push_token: pushToken
        }, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error updating push token:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Toggle notifications on/off
  toggleNotifications: async (enabled) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.post(API_ENDPOINTS.NOTIFICATION_TOGGLE, {
          notifications_enabled: enabled
        }, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error toggling notifications:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Send notification to specific user (Admin function)
  sendNotificationToUser: async (notificationData) => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.post(API_ENDPOINTS.SEND_NOTIFICATION_TO_USER, notificationData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      });
    } catch (error) {
      console.error('Error sending notification to user:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Helper: refresh access token using refresh token
export const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');
  const response = await axios.post(getApiUrl(API_ENDPOINTS.REFRESH_TOKEN), { refresh: refreshToken });
  const newAccessToken = response.data.access;
  await AsyncStorage.setItem('accessToken', newAccessToken);
  return newAccessToken;
};

// Helper: wrap API call with auto-refresh logic (for axios)
export const apiCallWithAutoRefresh = async (apiFunc) => {
  let accessToken = await AsyncStorage.getItem('accessToken');
  try {
    return await apiFunc(accessToken);
  } catch (err) {
    // If error is due to expired token, try to refresh
    if (err.response && err.response.status === 401) {
      try {
        accessToken = await refreshAccessToken();
        return await apiFunc(accessToken);
      } catch (refreshErr) {
        // If refresh fails, log out user (clear tokens)
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        throw new Error('Session expired. Please log in again.');
      }
    }
    throw err;
  }
};

// Helper: wrap fetch API call with auto-refresh logic
export const fetchWithAutoRefresh = async (fetchFunc) => {
  let accessToken = await AsyncStorage.getItem('accessToken');
  try {
    const response = await fetchFunc(accessToken);
    if (response.status === 401) {
      // Token expired, try to refresh
      try {
        accessToken = await refreshAccessToken();
        const retryResponse = await fetchFunc(accessToken);
        if (retryResponse.status === 401) {
          // Still 401 after refresh, clear tokens
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          throw new Error('Session expired. Please log in again.');
        }
        return retryResponse;
      } catch (refreshErr) {
        // If refresh fails, clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        throw new Error('Session expired. Please log in again.');
      }
    }
    return response;
  } catch (err) {
    // If it's already our custom error, re-throw it
    if (err.message === 'Session expired. Please log in again.') {
      throw err;
    }
    // For other errors, try refresh once
    try {
      accessToken = await refreshAccessToken();
      const retryResponse = await fetchFunc(accessToken);
      if (retryResponse.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        throw new Error('Session expired. Please log in again.');
      }
      return retryResponse;
    } catch (refreshErr) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      throw new Error('Session expired. Please log in again.');
    }
  }
};

export default api; 