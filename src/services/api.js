import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://192.168.1.148:8000';

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
      const response = await api.get(`/api/reviews/?food_item=${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  postReview: async (reviewData, accessToken) => {
    try {
      const headers = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      // Use axios.post directly for FormData to avoid base config issues
      const response = await axios.post(
        API_BASE_URL + '/api/reviews/',
        reviewData,
        { headers }
      );
      return response.data;
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
  signup: async (username, email, password) => {
    try {
      const response = await api.post('/api/register/', { username, email, password });
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
  getProfile: async (accessToken) => {
    try {
      const response = await api.get('/api/profile/me/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  updateProfile: async ({ username, email, bio, profileImage }, accessToken) => {
    try {
      console.log('API: Updating profile with data:', { username, email, bio });
      console.log('API: Token present:', !!accessToken);
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('user[username]', username);
      formData.append('user[email]', email);
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
    } catch (error) {
      console.error('Error updating profile:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

export default api; 