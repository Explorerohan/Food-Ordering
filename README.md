# SpiceBite Food Ordering App

A React Native food ordering application built with Expo SDK 52 that displays a beautiful dashboard of food items fetched from your API.

## Features

- 🍕 Beautiful food item cards with images, ratings, and details
- 🏷️ Category filtering (Pizza, Burger, Salad, etc.)
- ⭐ Star ratings display
- 🥬 Vegetarian and spicy badges
- 🔄 Pull-to-refresh functionality
- 📱 Responsive design for mobile devices
- 🔍 Search and notification icons (ready for future implementation)

## API Integration

The app is configured to fetch food items from your API endpoint:
```
http://192.168.1.5:8000/foods/
```

### Expected API Response Format

Your API should return an array of food items with the following structure:

```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic tomato sauce with mozzarella cheese",
    "price": 12.99,
    "category": "Pizza",
    "image": "https://example.com/pizza-image.jpg",
    "rating": 4.5,
    "preparationTime": "20-25 min",
    "isVegetarian": true,
    "isSpicy": false
  }
]
```

### Required Fields

- `id`: Unique identifier for the food item
- `name`: Name of the food item
- `description`: Brief description
- `price`: Price in decimal format
- `category`: Category name (used for filtering)
- `image`: URL to the food item image
- `rating`: Rating from 0 to 5 (decimal allowed)
- `preparationTime`: Estimated preparation time
- `isVegetarian`: Boolean indicating if vegetarian
- `isSpicy`: Boolean indicating if spicy

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web

## Project Structure

```
spicebite-food-app/
├── src/
│   ├── components/
│   │   ├── FoodItemCard.js      # Individual food item display
│   │   └── CategoryFilter.js    # Category filtering component
│   ├── screens/
│   │   └── DashboardScreen.js   # Main dashboard screen
│   ├── services/
│   │   └── api.js              # API service configuration
│   └── utils/                  # Utility functions (future use)
├── App.js                      # Main app component
└── package.json
```

## API Configuration

The API configuration is located in `src/services/api.js`. You can modify:

- **Base URL**: Change `API_BASE_URL` to your server address
- **Endpoints**: Update the endpoint paths if needed
- **Headers**: Add authentication headers if required

## Customization

### Adding New Features

1. **Search Functionality**: Implement search in `DashboardScreen.js`
2. **Cart System**: Add cart state management
3. **User Authentication**: Integrate login/signup screens
4. **Order Tracking**: Add order status screens

### Styling

The app uses a modern design with:
- Primary color: `#FF6B35` (orange)
- Background: `#f8f9fa` (light gray)
- Cards: White with subtle shadows

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure your API server is running on `http://192.168.1.5:8000`
   - Check if the device/emulator can access the IP address
   - Verify the `/foods/` endpoint returns the expected data format

2. **Images Not Loading**
   - Ensure image URLs are accessible
   - Check if images are served over HTTPS (required for some devices)

3. **App Not Starting**
   - Clear Metro cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Development Notes

- The app uses Expo SDK 52 with React Native 0.76.3
- Axios is used for API calls
- Expo Vector Icons for icons
- Mock data is available as fallback in `src/services/api.js`

## Next Steps

1. Test the app with your API
2. Add authentication if required
3. Implement cart functionality
4. Add order placement features
5. Implement push notifications

## Support

If you encounter any issues or need help with API integration, please check:
1. API response format matches the expected structure
2. Network connectivity between device and API server
3. CORS settings on your API server (if testing on web) 