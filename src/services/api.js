import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_BASE_URL = 'http://192.168.254.5:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Food API service
export const foodApi = {
  // Get all food items
  getAllFoodItems: async () => {
    try {
      const response = await api.get('/foods/');
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
        const response = await api.get(`/api/reviews/?food_item=${foodId}`, {
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
          API_BASE_URL + '/api/reviews/',
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
      const response = await api.post('/api/token/', { username, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  signup: async (username, email, phoneNumber, password) => {
    try {
      const response = await api.post('/api/register/', { username, email, phone_number: phoneNumber, password });
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  refreshToken: async (refresh) => {
    try {
      const response = await api.post('/api/token/refresh/', { refresh });
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },
};

// Profile API service
export const profileApi = {
  getProfile: async () => {
    try {
      return await apiCallWithAutoRefresh(async (accessToken) => {
        const response = await api.get('/api/profile/me/', {
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
          api.defaults.baseURL + '/api/profile/me/',
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

// Helper: refresh access token using refresh token
export const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');
  const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, { refresh: refreshToken });
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