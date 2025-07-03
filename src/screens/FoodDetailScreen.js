import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput, Platform, ActivityIndicator, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { reviewsApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FoodDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params;

  // State for the review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Extract sizes
  const sizes = item.sizes || [];
  const sizeNames = sizes.map(s => s.size);
  // Default to Small if available, else first size
  const defaultSize = sizeNames.includes('Small') ? 'Small' : sizeNames[0];
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const selectedSizeObj = sizes.find(s => s.size === selectedSize);

  // Spice levels
  const spiceLevels = ['Mild', 'Medium', 'Spicy'];
  const [selectedSpice, setSelectedSpice] = useState('Mild');

  useEffect(() => {
    fetchReviews();
  }, [item.id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const fetchedReviews = await reviewsApi.getReviewsByFoodId(item.id);
      setReviews(fetchedReviews);
    } catch (error) {
      // You might want to show an error to the user
      console.error("Failed to fetch reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleOrderNow = () => {
    Alert.alert('Order Placed', `You have ordered 1 x ${item.name} (${selectedSize}, ${selectedSpice}) for ₹${selectedSizeObj?.price}`);
  };

  const handleAddToCart = () => {
    Alert.alert('Added to Cart', `Added 1 x ${item.name} (${selectedSize}, ${selectedSpice}) to cart.`);
  };

  const pickImage = async () => {
    console.log('pickImage called');
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('Media library permission status:', status);
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      console.log('Image picker result:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Image picker error:', e);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please enter a comment.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('food_item', item.id);
    formData.append('rating', rating);
    formData.append('comment', comment);

    if (image) {
      const uriParts = image.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('image', {
        uri: image,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('Access token used for review:', accessToken);
      if (!accessToken) {
        Alert.alert('Not Logged In', 'You must be logged in to submit a review.');
        setIsSubmitting(false);
        return;
      }

      // Use fetch for FormData
      const response = await fetch('http://192.168.254.5:8000/api/reviews/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Do NOT set Content-Type, let fetch handle it for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error posting review:', errorData);
        Alert.alert('Submission Failed', 'Could not submit your review. Please try again.');
      } else {
        Alert.alert('Review Submitted', 'Thank you for your feedback!');
        setRating(0);
        setComment('');
        setImage(null);
        fetchReviews(); // Refetch reviews
      }
    } catch (error) {
      Alert.alert('Submission Failed', 'Could not submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color="#FFD700"
        style={{ marginRight: 1 }}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <TouchableOpacity style={styles.backButtonOverlay} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.price}>₹{selectedSizeObj ? selectedSizeObj.price : 'N/A'}</Text>
          {/* Price and name */}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Size selector */}
          <Text style={styles.sectionTitle}>Choose Size</Text>
          <View style={styles.selectorRow}>
            {sizes.map((sizeObj) => (
              <TouchableOpacity
                key={sizeObj.size}
                style={[styles.pillBtn, selectedSize === sizeObj.size && styles.pillBtnActive]}
                onPress={() => setSelectedSize(sizeObj.size)}
              >
                <Text style={[styles.pillText, selectedSize === sizeObj.size && styles.pillTextActive]}>
                  {sizeObj.size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Spice level selector */}
          <Text style={styles.sectionTitle}>Choose Spice Level</Text>
          <View style={styles.selectorRow}>
            {spiceLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.pillBtn, selectedSpice === level && styles.pillBtnActive]}
                onPress={() => setSelectedSpice(level)}
              >
                <Text style={[styles.pillText, selectedSpice === level && styles.pillTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Reviews Section */}
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviewsLoading ? (
            <ActivityIndicator size="large" color="#FF6B35" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.reviewsSection}>
              {reviews.length > 0 ? (
                reviews.map((review, idx) => (
                  <View key={idx} style={styles.reviewCard}>
                    {review.image && (
                      <Image
                        source={{ uri: review.image.startsWith('http') ? review.image : `http://192.168.254.5:8000${review.image}` }}
                        style={styles.reviewImage}
                      />
                    )}
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewUser}>{review.user || 'Anonymous'}</Text>
                      <View style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
              )}
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Add Review Section */}
          <Text style={styles.sectionTitle}>Leave a Review</Text>
          <View style={styles.reviewForm}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFD700"
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment here..."
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="camera" size={24} color="#555" />
              <Text style={styles.imagePickerText}>{image ? 'Image Selected' : 'Add a photo'}</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.previewImage} />}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* Order/Cart buttons at bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.cartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.orderBtn} onPress={handleOrderNow}>
          <Text style={styles.orderBtnText}>Order Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: width * 0.95,
    marginBottom: 0,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 140,
    paddingTop: 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: 0.1,
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 18,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
    marginTop: 0,
    letterSpacing: 0.1,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    justifyContent: 'flex-start',
  },
  pillBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  pillText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  cartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orderBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  orderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewForm: {
    marginTop: 10,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  star: {
    marginRight: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  reviewsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUser: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
});

export default FoodDetailScreen; 