import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput, Platform, ActivityIndicator, Button, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { reviewsApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCallWithAutoRefresh } from '../services/api';

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
  const [searchText, setSearchText] = useState('');
  // State for review image modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  // State for quantity
  const [quantity, setQuantity] = useState(1);

  // Dynamic placeholder cycling through food names
  const foodNames = [
    'Pizza',
    'Burger',
    'Biryani',
    'Pasta',
    'Sushi',
    'Tacos',
    'Dosa',
    'Paneer',
    'Noodles',
    'Salad',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      // Animate out (down)
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        // After out, update text and animate in
        setDisplayedIndex((prev) => (prev + 1) % foodNames.length);
        setPlaceholderIndex((prev) => (prev + 1) % foodNames.length);
        slideAnim.setValue(-1); // Start new text above
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          setIsAnimating(false);
        });
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [placeholderIndex]);

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

  const handleAddToCart = async () => {
    try {
      const requestBody = {
        food_item_id: item.id,
        quantity: quantity,
        size_string: selectedSize,  // Backend expects 'size_string' (the size name as string)
        spice_level: selectedSpice,  // Backend expects 'spice_level' (the spice level as string)
      };
      
      console.log('Cart API request body:', requestBody);
      console.log('Cart API endpoint:', 'http://192.168.254.6:8000/api/cart/');
      console.log('Item ID:', item.id);
      console.log('Item name:', item.name);
      console.log('Selected size:', selectedSize);
      console.log('Selected spice level:', selectedSpice);
      console.log('Quantity:', quantity);
      
      const cartData = await apiCallWithAutoRefresh(async (accessToken) => {
                 const response = await fetch('http://192.168.254.6:8000/api/cart/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error('Cart API response status:', response.status);
          console.error('Cart API response text:', responseText);
          
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || `Server error: ${response.status}`);
          } catch (parseError) {
            throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
          }
        }

        const responseText = await response.text();
        console.log('Cart API success response:', responseText);
        
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse success response:', parseError);
          return { message: 'Item added to cart successfully' };
        }
      });
      
      Alert.alert(
        'Added to Cart', 
        `Added ${quantity} x ${item.name} (${selectedSize}) to cart.`,
        [
          { text: 'Continue Shopping', style: 'default' },
          { text: 'View Cart', onPress: () => navigation.navigate('CartDetails', { refresh: true }) }
        ]
      );
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', error.message || 'Could not add to cart. Please try again.');
    }
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
              const response = await fetch('http://192.168.254.6:8000/api/reviews/', {
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

  const animateButton = (scaleRef) => {
    Animated.sequence([
      Animated.timing(scaleRef, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleRef, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // --- Header copied from DashboardScreen.js ---
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackArrow}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerSearchBox}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.headerSearchIcon} />
          <View style={styles.animatedPlaceholderContainer} pointerEvents="none">
            <Animated.Text
              style={[
                styles.animatedPlaceholder,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [-32, 0, 32],
                      }),
                    },
                  ],
                  opacity: slideAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0, 1, 0],
                  }),
                },
              ]}
              numberOfLines={1}
            >
              {`Search ${foodNames[displayedIndex]}...`}
            </Animated.Text>
          </View>
          <TextInput
            style={[styles.headerSearchInput, { position: 'absolute', left: 0, right: 0, width: '100%' }]}
            placeholder=""
            value={searchText}
            onChangeText={setSearchText}
            underlineColorAndroid="transparent"
            returnKeyType="search"
          />
        </View>
        <View style={styles.headerIcons}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" style={{ marginHorizontal: 6 }} />
          <Ionicons name="cart-outline" size={24} color="#333" style={{ marginHorizontal: 6 }} />
        </View>
      </View>
    </View>
  );
  // --- End Header ---

  const renderSizeOption = (sizeObj) => (
    <TouchableOpacity
      key={sizeObj.size}
      style={[styles.pillBtn, selectedSize === sizeObj.size && styles.pillBtnActive]}
      onPress={() => setSelectedSize(sizeObj.size)}
    >
      <View style={styles.pillBtnContent}>
        <Text style={[styles.pillText, selectedSize === sizeObj.size && styles.pillTextActive]}>
          {sizeObj.size}
        </Text>
        {selectedSize === sizeObj.size && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.tickIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSpiceOption = (level) => (
    <TouchableOpacity
      key={level}
      style={[styles.pillBtn, selectedSpice === level && styles.pillBtnActive]}
      onPress={() => setSelectedSpice(level)}
    >
      <View style={styles.pillBtnContent}>
        <Text style={[styles.pillText, selectedSpice === level && styles.pillTextActive]}>
          {level}
        </Text>
        {selectedSpice === level && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.tickIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Handler to open modal with image
  const handleReviewImagePress = (imgUrl) => {
    setModalImage(imgUrl);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right"]}>
      {renderHeader()}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
        </View>
        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{selectedSizeObj ? selectedSizeObj.price : 'N/A'}</Text>
          </View>
          {/* Price and name */}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Size selector */}
          <Text style={styles.sectionTitle}>Choose Size</Text>
          <View style={styles.selectorRow}>
            {sizes.map(renderSizeOption)}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Spice level selector */}
          <Text style={styles.sectionTitle}>Choose Spice Level</Text>
          <View style={styles.selectorRow}>
            {spiceLevels.map(renderSpiceOption)}
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
                    <View style={styles.reviewContentRow}>
                      <View style={styles.reviewContentLeft}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewHeaderLeft}>
                            {review.profile_picture && typeof review.profile_picture === 'string' && review.profile_picture.length > 0 ? (
                              <Image
                                source={{ uri: review.profile_picture }}
                                style={styles.reviewAvatar}
                              />
                            ) : (
                              <Ionicons name="person-circle" size={28} color="#bbb" style={styles.reviewAvatar} />
                            )}
                            <Text style={styles.reviewUser}>{review.user || 'Anonymous'}</Text>
                          </View>
                          <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </View>
                        </View>
                        <View style={styles.reviewImageCommentRow}>
                          <Text style={[styles.reviewComment, { flex: 1 }]}>{review.comment}</Text>
                          {review.image && typeof review.image === 'string' && review.image.length > 0 && (
                                                          <TouchableOpacity onPress={() => handleReviewImagePress(review.image.startsWith('http') ? review.image : `http://192.168.254.6${review.image}`)}>
                              <Image
                                                                  source={{ uri: review.image.startsWith('http') ? review.image : `http://192.168.254.6${review.image}` }}
                                style={styles.reviewImageSmall}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
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
      {/* Cart button at bottom */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarSpacer} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <View style={[styles.quantityContainer, styles.quantityBox]}> 
            <TouchableOpacity 
              style={styles.quantityBtn} 
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#FF6B35" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityBtn} 
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.cartBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Modal for large review image */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalImageContainer}>
              <Image source={{ uri: modalImage }} style={styles.modalImage} resizeMode="contain" />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
    marginTop: -10,
    paddingTop: 0,
  },
  image: {
    width: '100%',
    height: width * 0.95,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },
  name: {
    fontSize: 22,
    fontWeight: '500',
    color: '#222',
    marginBottom: 0,
    marginTop: -6,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    lineHeight: 22,
    letterSpacing: 0.1,
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
    flexWrap: 'wrap',
  },
  pillBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    minWidth: 0,
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    borderRadius: 6,
  },
  pillText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
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
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarSpacer: {
    flex: 1,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    gap: 8,
    justifyContent: 'center',
    minWidth: 140,
  },
  cartBtnText: {
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 0,
    marginTop: 8,
    letterSpacing: 0.2,
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
  reviewContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewContentLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  noReviewsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    height: 48,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  headerBackArrow: {
    marginRight: 12,
  },
  headerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#fff',
    borderColor: '#FF6B35',
    borderWidth: 2,
    borderRadius: 7,
    paddingHorizontal: 12,
    height: 32,
    marginLeft: 0,
    marginRight: 8,
    flex: 1,
    minWidth: 0,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  headerSearchIcon: {
    marginRight: 8,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 0,
    marginTop: 0,
    marginBottom: 0,
    color: '#333',
    minWidth: 0,
  },
  animatedPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    height: 32,
    overflow: 'hidden',
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#888',
    fontSize: 18,
    paddingLeft: 0,
    paddingRight: 0,
    textAlignVertical: 'center',
  },
  pillBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickIcon: {
    marginLeft: 8,
  },
  reviewImageSmall: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  reviewImageCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '90%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 10,
    height: 48,
    marginRight: 16,
    minWidth: 110,
    justifyContent: 'center',
  },
});

export default FoodDetailScreen; 