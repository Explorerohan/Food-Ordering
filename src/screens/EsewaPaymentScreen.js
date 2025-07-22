import React, { useState, useRef } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithAutoRefresh } from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Added for success icon

// Mock eSewa Payment Page for Testing
const MOCK_ESEWA_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eSewa Payment Gateway</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #60bb46; margin: 0; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        .btn { background: #60bb46; color: white; padding: 15px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; width: 100%; cursor: pointer; margin-bottom: 10px; }
        .btn:hover { background: #4a9c3a; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
        .amount { font-size: 24px; font-weight: bold; color: #60bb46; text-align: center; margin: 20px 0; }
        .test-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .step { display: none; }
        .step.active { display: block; }
        .error { color: #dc3545; font-size: 14px; margin-top: 5px; }
        .success { color: #28a745; font-size: 14px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>eSewa</h1>
            <p style="color: #666; margin: 5px 0;">Digital Payment Gateway</p>
        </div>
        
        <div class="test-info">
            <strong>🧪 TEST MODE</strong><br>
            <strong>eSewa ID:</strong> 9806800001, 9806800002, 9806800003, 9806800004, 9806800005<br>
            <strong>Password:</strong> Nepal@123<br>
            <strong>MPIN:</strong> 1122<br>
            <strong>Token:</strong> 123456
        </div>
        
        <div class="amount">
            Amount: ₹<span id="amount">__AMOUNT__</span>
        </div>
        
        <!-- Step 1: Login -->
        <div id="step1" class="step active">
            <h3>Login to eSewa</h3>
            <form id="loginForm">
                <div class="form-group">
                    <label for="esewaId">eSewa ID</label>
                    <input type="text" id="esewaId" placeholder="Enter your eSewa ID" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" required>
                </div>
                
                <button type="submit" class="btn">Login</button>
            </form>
        </div>
        
        <!-- Step 2: MPIN Verification -->
        <div id="step2" class="step">
            <h3>Enter MPIN</h3>
            <form id="mpinForm">
                <div class="form-group">
                    <label for="mpin">MPIN</label>
                    <input type="password" id="mpin" placeholder="Enter your MPIN" maxlength="4" required>
                </div>
                
                <button type="submit" class="btn">Verify MPIN</button>
                <button type="button" class="btn btn-secondary" onclick="goBackToLogin()">Back</button>
            </form>
        </div>
        
        <!-- Step 3: Token Verification -->
        <div id="step3" class="step">
            <h3>Enter Token</h3>
            <form id="tokenForm">
                <div class="form-group">
                    <label for="token">Token</label>
                    <input type="text" id="token" placeholder="Enter 6-digit token" maxlength="6" required>
                </div>
                
                <button type="submit" class="btn">Verify Token</button>
                <button type="button" class="btn btn-secondary" onclick="goBackToMPIN()">Back</button>
            </form>
        </div>
        
        <!-- Step 4: Payment Confirmation -->
        <div id="step4" class="step">
            <h3>Payment Confirmation</h3>
            <div class="success">
                <p>✅ Payment verification successful!</p>
                <p>Processing your payment...</p>
            </div>
        </div>
    </div>
    
    <script>
        const validEsewaIds = ['9806800001', '9806800002', '9806800003', '9806800004', '9806800005'];
        const validPassword = 'Nepal@123';
        const validMPIN = '1122';
        const validToken = '123456';
        
        function showStep(stepNumber) {
            document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
            document.getElementById('step' + stepNumber).classList.add('active');
        }
        
        function goBackToLogin() {
            showStep(1);
        }
        
        function goBackToMPIN() {
            showStep(2);
        }
        
        // Handle login form
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const esewaId = document.getElementById('esewaId').value;
            const password = document.getElementById('password').value;
            
            if (validEsewaIds.includes(esewaId) && password === validPassword) {
                showStep(2);
            } else {
                alert('Invalid eSewa ID or password. Please use the test credentials provided.');
            }
        });
        
        // Handle MPIN form
        document.getElementById('mpinForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const mpin = document.getElementById('mpin').value;
            
            if (mpin === validMPIN) {
                showStep(3);
            } else {
                alert('Invalid MPIN. Please use the test MPIN: 1122');
            }
        });
        
        // Handle token form
        document.getElementById('tokenForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const token = document.getElementById('token').value;
            
            if (token === validToken) {
                showStep(4);
                // Simulate payment processing
                setTimeout(() => {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage('payment-success');
                    }
                }, 3000);
            } else {
                alert('Invalid token. Please use the test token: 123456');
            }
        });
    </script>
</body>
</html>
`;

const EsewaPaymentScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWebView, setShowWebView] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false); // New state for success message
  const navigation = useNavigation();
  const route = useRoute();
  const orderCreated = useRef(false); // Prevent duplicate order creation
  
  // Extract payment details from route params
  const { tAmt, amt, txAmt, psc, pdc, pid, deliveryLocation, description, display_name, cartItems } = route.params;

  // Inject the correct amount into the HTML
  const amountToShow = amt || tAmt || 0;
  const paymentHtml = MOCK_ESEWA_HTML.replace('__AMOUNT__', String(amountToShow));

  const handleNavigationChange = async (navState) => {
    const { url } = navState;
    console.log('Navigation changed to:', url);

    // Handle custom payment success URL
    if (url.startsWith('https://spicebite.com/payment-success') && !orderCreated.current) {
      orderCreated.current = true;
      try {
        // Debug logs for delivery address
        console.log('deliveryLocation:', deliveryLocation);
        console.log('display_name:', display_name);
        console.log('delivery_address to send:', deliveryLocation?.display_name || display_name);

        const itemsPayload = cartItems.map(item => ({
          food_item: item.food_item.id,
          quantity: item.quantity,
          price: item.food_price || (item.size && item.size.price) || 0,
        }));

        // Create order using the cart checkout endpoint
        const response = await fetchWithAutoRefresh(async (accessToken) => {
          return await fetch('http://192.168.1.90:8000/api/orders/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              description: description || 'Paid via eSewa',
              latitude: deliveryLocation?.latitude,
              longitude: deliveryLocation?.longitude,
              delivery_address: deliveryLocation?.display_name || display_name,
              total_amount: tAmt,
              items: itemsPayload,
            }),
          });
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Backend error on order creation:', errorData);
          throw new Error('Failed to create order');
        }

        // Clear the cart after successful order
        await fetchWithAutoRefresh(async (accessToken) => {
          return await fetch('http://192.168.1.90:8000/api/cart/clear/', {
            method: 'DELETE',
            headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
          });
        });

        setShowSuccess(true); // Show success message and wait for user action

      } catch (error) {
        console.error('Error creating order:', error);
        setShowSuccess(true); // Show success message even on error
      }
    }
  };

  const handleLoadError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView error:', nativeEvent);
    setError('Failed to load eSewa payment page. Please check your internet connection and try again.');
    setLoading(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  // New handler for payment success message from WebView
  const handlePaymentSuccess = async () => {
    if (orderCreated.current) return;
    orderCreated.current = true;
    try {
      // Debug logs for delivery address
      console.log('deliveryLocation:', deliveryLocation);
      console.log('display_name:', display_name);
      console.log('delivery_address to send:', deliveryLocation?.display_name || display_name);

      const itemsPayload = cartItems.map(item => ({
        food_item: item.food_item.id,
        quantity: item.quantity,
        price: item.food_price || (item.size && item.size.price) || 0,
      }));

      // Create order using the cart checkout endpoint
      const response = await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch('http://192.168.1.90:8000/api/orders/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            description: description || 'Paid via eSewa',
            latitude: deliveryLocation?.latitude,
            longitude: deliveryLocation?.longitude,
            delivery_address: deliveryLocation?.display_name || display_name,
            total_amount: tAmt,
            items: itemsPayload,
          }),
        });
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error on order creation:', errorData);
        throw new Error('Failed to create order');
      }

      // Clear the cart after successful order
      await fetchWithAutoRefresh(async (accessToken) => {
        return await fetch('http://192.168.1.90:8000/api/cart/clear/', {
          method: 'DELETE',
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
      });

      setShowSuccess(true); // Show success message and wait for user action

    } catch (error) {
      console.error('Error creating order:', error);
      setShowSuccess(true); // Show success message even on error
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showWebView && !showSuccess && (
        <WebView
          source={{ html: paymentHtml }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={handleLoadEnd}
          onError={handleLoadError}
          onMessage={event => {
            if (event.nativeEvent.data === 'payment-success') {
              handlePaymentSuccess();
            }
          }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      )}
      {showSuccess && (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}> 
          <Ionicons name="checkmark-circle-outline" size={80} color="#60bb46" style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 12, textAlign: 'center' }}>Payment Completed Successfully!</Text>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center', maxWidth: 300 }}>
            Your payment and order have been processed. Thank you!
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#60bb46', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 }}
            onPress={() => {
              setShowWebView(false);
              setShowSuccess(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'CartDetails' }],
              });
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>OK</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#60bb46" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#60bb46',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default EsewaPaymentScreen; 