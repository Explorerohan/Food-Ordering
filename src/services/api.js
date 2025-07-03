import axios from 'axios';

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

// Mock data for development (fallback if API is not available)
// export const mockFoodData = [
//   {
//     id: 1,
//     name: 'Margherita Pizza',
//     description: 'Classic tomato sauce with mozzarella cheese',
//     price: 12.99,
//     category: 'Pizza',
//     image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
//     rating: 4.5,
//     preparationTime: '20-25 min',
//     isVegetarian: true,
//     isSpicy: false,
//   },
//   {
//     id: 2,
//     name: 'Chicken Burger',
//     description: 'Grilled chicken with fresh vegetables and special sauce',
//     price: 9.99,
//     category: 'Burger',
//     image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
//     rating: 4.3,
//     preparationTime: '15-20 min',
//     isVegetarian: false,
//     isSpicy: true,
//   },
//   {
//     id: 3,
//     name: 'Caesar Salad',
//     description: 'Fresh romaine lettuce with parmesan cheese and croutons',
//     price: 8.99,
//     category: 'Salad',
//     image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
//     rating: 4.2,
//     preparationTime: '10-15 min',
//     isVegetarian: true,
//     isSpicy: false,
//   },
//   {
//     id: 4,
//     name: 'Pasta Carbonara',
//     description: 'Creamy pasta with bacon and parmesan cheese',
//     price: 14.99,
//     category: 'Pasta',
//     image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
//     rating: 4.6,
//     preparationTime: '25-30 min',
//     isVegetarian: false,
//     isSpicy: false,
//   },
//   {
//     id: 5,
//     name: 'Chocolate Cake',
//     description: 'Rich chocolate cake with vanilla ice cream',
//     price: 6.99,
//     category: 'Dessert',
//     image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
//     rating: 4.8,
//     preparationTime: '5-10 min',
//     isVegetarian: true,
//     isSpicy: false,
//   },
//   {
//     id: 6,
//     name: 'Fish Tacos',
//     description: 'Grilled fish with fresh salsa and lime',
//     price: 11.99,
//     category: 'Tacos',
//     image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
//     rating: 4.4,
//     preparationTime: '18-22 min',
//     isVegetarian: false,
//     isSpicy: true,
//   },
// ];

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