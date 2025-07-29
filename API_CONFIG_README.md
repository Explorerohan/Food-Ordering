# API Configuration Guide

## Overview
This project now uses a centralized API configuration system to manage all backend endpoints and base URLs. This makes it easy to switch between different environments (development, staging, production) by changing just one file.

## Configuration File
The main configuration file is located at: `src/config/apiConfig.js`

## How to Change the Backend URL
To change the backend URL (e.g., when switching from development to production), simply edit the `API_BASE_URL` in `src/config/apiConfig.js`:

```javascript
// Development
export const API_BASE_URL = 'http://192.168.1.90:8000';

// Production (example)
export const API_BASE_URL = 'https://your-production-domain.com';

// Staging (example)
export const API_BASE_URL = 'https://staging.your-domain.com';
```

## Available Configuration Options

### Base URLs
- `API_BASE_URL`: The main backend URL for HTTP requests
- `WS_BASE_URL`: The WebSocket URL for real-time features

### API Endpoints
All API endpoints are defined in the `API_ENDPOINTS` object:

```javascript
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
  
  // Reviews
  REVIEWS: '/api/reviews/',
  
  // Chat
  CHAT_WS: '/ws/chat/',
};
```

## Helper Functions

### getApiUrl(endpoint)
Converts a relative endpoint to a full URL:
```javascript
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';

const fullUrl = getApiUrl(API_ENDPOINTS.LOGIN);
// Result: http://192.168.1.90:8000/api/token/
```

### getWsUrl(endpoint)
Converts a relative WebSocket endpoint to a full WebSocket URL:
```javascript
import { getWsUrl } from '../config/apiConfig';

const wsUrl = getWsUrl('/ws/chat/room1/?token=abc123');
// Result: ws://192.168.1.90:8000/ws/chat/room1/?token=abc123
```

### getImageUrl(imagePath)
Handles image URLs, automatically prepending the base URL if needed:
```javascript
import { getImageUrl } from '../config/apiConfig';

const imageUrl = getImageUrl('/media/food1.jpg');
// Result: http://192.168.1.90:8000/media/food1.jpg
```

## Usage in Components
To use the centralized configuration in your components:

```javascript
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';

// Instead of hardcoding URLs like this:
// fetch('http://192.168.1.90:8000/api/cart/')

// Use this:
fetch(getApiUrl(API_ENDPOINTS.CART))
```

## Benefits
1. **Single Source of Truth**: All API URLs are defined in one place
2. **Easy Environment Switching**: Change the base URL once to switch environments
3. **Consistency**: All components use the same configuration
4. **Maintainability**: Easy to update endpoints across the entire app
5. **Type Safety**: Using constants prevents typos in endpoint URLs

## Migration Notes
All hardcoded IP addresses have been replaced with the centralized configuration. The following files were updated:
- `src/services/api.js`
- `src/screens/*.js` (all screen files)
- `App.js`

If you need to add new API endpoints, simply add them to the `API_ENDPOINTS` object in `apiConfig.js` and use them throughout your components. 