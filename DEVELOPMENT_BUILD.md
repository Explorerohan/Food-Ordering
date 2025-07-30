# Development Build Setup for Push Notifications

## Why Development Build?

Expo Go removed push notification support in SDK 53+. To use push notifications, you need to create a **Development Build**.

## Prerequisites

1. **Expo CLI** (latest version)
2. **EAS CLI** (Expo Application Services)
3. **Expo Account** (free)

## Setup Steps

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS
```bash
eas build:configure
```

### 4. Create Development Build

#### For Android:
```bash
eas build --profile development --platform android
```

#### For iOS:
```bash
eas build --profile development --platform ios
```

### 5. Install Development Build

#### Android:
- Download the APK from the build link
- Install on your device/emulator
- Enable "Install from Unknown Sources" if needed

#### iOS:
- Download the IPA from the build link
- Install via Xcode or TestFlight

## Testing Push Notifications

### 1. Start Development Server
```bash
npx expo start --dev-client
```

### 2. Open Development Build
- Open the development build app on your device
- Scan the QR code or enter the URL manually

### 3. Test Notifications
- Login to your app
- Place an order
- Check for notifications

## Troubleshooting

### Push Token Issues
- Make sure you're using the development build, not Expo Go
- Check that the project ID in `notificationService.js` matches your Expo project
- Verify the user is logged in before sending push token

### Build Issues
- Ensure all dependencies are installed
- Check that your Expo account has the necessary permissions
- Verify your `app.json` configuration

## Alternative: Local Development

If you want to test locally without EAS:

### 1. Install Expo Dev Client
```bash
npx expo install expo-dev-client
```

### 2. Create Local Build
```bash
npx expo run:android
# or
npx expo run:ios
```

## Benefits of Development Build

✅ **Full Push Notification Support**  
✅ **Native Module Access**  
✅ **Custom Native Code**  
✅ **Better Performance**  
✅ **Production-like Environment**

## Next Steps

1. Create your development build
2. Test push notifications
3. Deploy to production when ready

For more information: https://docs.expo.dev/develop/development-builds/introduction/ 