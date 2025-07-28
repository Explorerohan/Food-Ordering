import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      
      Alert.alert(
        'Email Sent', 
        'If an account with this email exists, you will receive a password reset link shortly. Please check your email and follow the instructions.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setEmail('');
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right"]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={80} color="#FF6B35" />
          </View>
          
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Check your spam folder if you don't see the email
            </Text>
            <Text style={styles.helpText}>
              • Make sure you're using the email associated with your account
            </Text>
            <Text style={styles.helpText}>
              • The reset link expires in 24 hours
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginButton: {
    paddingVertical: 12,
  },
  backToLoginText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '100%',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen; 