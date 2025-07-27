import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import FoodItemCard from '../components/FoodItemCard';
import CategoryFilter from '../components/CategoryFilter';
import { foodApi, mockFoodData, profileApi } from '../services/api';

const API_BASE_URL = 'http://192.168.1.90:8000';

const DashboardScreen = ({ username }) => {
  const navigation = useNavigation();
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userName, setUserName] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 0,
    sortBy: 'default'
  });
  const [tempFilters, setTempFilters] = useState({
    priceRange: 'all',
    rating: 0,
    sortBy: 'default'
  });
  const slideAnim = React.useRef(new Animated.Value(0)).current;

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
  }, []);

  useEffect(() => {
    fetchFoodItems();
  }, []); // Only fetch on initial load

  useEffect(() => {
    console.log('Categories state updated:', categories);
  }, [categories]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        try {
          const profile = await profileApi.getProfile();
          if (profile && profile.profile_picture) {
            setProfileImage(profile.profile_picture);
          }
          if (profile && profile.user && profile.user.username) {
            setUserName(profile.user.username);
          }
        } catch (error) {
          setProfileImage('https://randomuser.me/api/portraits/men/32.jpg');
          setUserName('User');
        }
      };
      fetchProfile();
    }, [])
  );

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for backend filtering
      const queryParams = new URLSearchParams();
      
      // Add category filter
      if (selectedCategory !== 'All') {
        queryParams.append('category', selectedCategory);
      }
      
      // Add price range filter
      if (filters.priceRange !== 'all') {
        queryParams.append('price_range', filters.priceRange);
      }
      
      // Add minimum rating filter
      if (filters.rating > 0) {
        queryParams.append('min_rating', filters.rating.toString());
      }
      
      // Add sorting
      if (filters.sortBy !== 'default') {
        queryParams.append('sort_by', filters.sortBy);
      }
      
      // Get food items with filters from backend
      const data = await foodApi.getAllFoodItems(queryParams);
      setFoodItems(data);
      
      // Fetch categories separately to ensure all categories are shown
      try {
        const categoriesData = await foodApi.getAllCategories();
        console.log('Fetched categories from API:', categoriesData);
        const apiCategories = categoriesData.map(category => ({ 
          name: category.name, 
          image: category.image 
        }));
        console.log('Processed categories:', apiCategories);
        // Add 'All' at the beginning with the provided URL image
        setCategories([{ 
          name: 'All', 
          image: 'https://neat-food.com/cdn/shop/files/neat_emmapharaoh_19march24_12.jpg?v=1712845654&width=4498' 
        }, ...apiCategories]);
      } catch (categoryError) {
        console.error('Error fetching categories:', categoryError);
        // Fallback to extracting categories from food items
        const categoryMap = {};
        data.forEach(item => {
          if (item.category && item.category.name) {
            categoryMap[item.category.name] = item.category.image || null;
            
          } else if (item.category && typeof item.category === 'string') {
            categoryMap[item.category] = null;
          }
        });
        const apiCategories = Object.entries(categoryMap).map(([name, image]) => ({ name, image }));
        console.log('Fallback categories from food items:', apiCategories);
        // Add 'All' at the beginning with the provided URL image
        setCategories([{ 
          name: 'All', 
          image: 'https://neat-food.com/cdn/shop/files/neat_emmapharaoh_19march24_12.jpg?v=1712845654&width=4498' 
        }, ...apiCategories]);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
      Alert.alert(
        'Connection Error',
        'Failed to load food items. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: fetchFoodItems }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for backend filtering
      const queryParams = new URLSearchParams();
      
      // Add category filter
      if (selectedCategory !== 'All') {
        queryParams.append('category', selectedCategory);
      }
      
      // Add price range filter
      if (tempFilters.priceRange !== 'all') {
        queryParams.append('price_range', tempFilters.priceRange);
      }
      
      // Add minimum rating filter
      if (tempFilters.rating > 0) {
        queryParams.append('min_rating', tempFilters.rating.toString());
      }
      
      // Add sorting
      if (tempFilters.sortBy !== 'default') {
        queryParams.append('sort_by', tempFilters.sortBy);
      }
      
      // Get food items with filters from backend
      const data = await foodApi.getAllFoodItems(queryParams);
      setFoodItems(data);
      
      // Apply the temporary filters to the actual filters
      setFilters(tempFilters);
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert(
        'Filter Error',
        'Failed to apply filters. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: applyFilters }
        ]
      );
    } finally {
      setLoading(false);
    }
  };





  const handleAddToCart = async (item) => {
    try {
      // Determine default size and spice level
      const sizes = item.sizes || [];
      let size_string = 'Small';
      if (!sizes.find(s => s.size === 'Small') && sizes.length > 0) {
        size_string = sizes[0].size;
      }
      const spice_level = 'Mild';
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.1.90:8000/api/cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ food_item_id: item.id, quantity: 1, size_string, spice_level }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      const cartData = await response.json();
      await AsyncStorage.setItem('cart', JSON.stringify(cartData));
      Alert.alert('Added to Cart', `${item.name} (${size_string}, ${spice_level}) has been added to your cart.`);
    } catch (error) {
      Alert.alert('Error', 'Could not add to cart. Please try again.');
    }
  };

  const renderItem = ({ item }) => {
    if (!item || typeof item !== 'object') return null;
    
    // Map food items to ensure correct image URL and fields
    let imageUrl = item.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = API_BASE_URL + imageUrl;
    }
    
    const mappedItem = {
      ...item,
      image: imageUrl,
      // Remove unsupported fields
      isVegetarian: undefined,
      isSpicy: undefined,
    };
    
    return <FoodItemCard item={mappedItem} onPress={handleFoodItemPress} onAddToCart={handleAddToCart} />;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoodItems();
    setRefreshing(false);
  };

  const handleFoodItemPress = (item) => {
    navigation.navigate('FoodDetailScreen', { item });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingRow}>
        <Text style={styles.greetingHello}><Text style={styles.greetingHelloBold}>Hello {userName || 'User'}!</Text> <Text style={styles.greetingWave}>👋</Text></Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      <Text style={styles.greetingTitle}>What would you like to order?</Text>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
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
            style={[styles.searchInput, { position: 'absolute', left: 0, right: 0, width: '100%' }]}
            placeholder=""
            value={''}
            underlineColorAndroid="transparent"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {isFilterVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isFilterVisible}
          onRequestClose={() => setIsFilterVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                  <Ionicons name="close" size={24} color="#222" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Price Range</Text>
                  <View style={styles.filterOptions}>
                    {['All', 'Under Rs.200', 'Rs.200-Rs.500', 'Over Rs.500'].map((range) => (
                      <TouchableOpacity
                        key={range}
                        style={[
                          styles.filterOption,
                          tempFilters.priceRange === range.toLowerCase() && styles.filterOptionSelected
                        ]}
                        onPress={() => setTempFilters({...tempFilters, priceRange: range.toLowerCase()})}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          tempFilters.priceRange === range.toLowerCase() && styles.filterOptionTextSelected
                        ]}>{range}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Rating Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Minimum Rating</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setTempFilters({...tempFilters, rating: star})}
                      >
                        <Ionicons
                          name={star <= tempFilters.rating ? "star" : "star-outline"}
                          size={30}
                          color={star <= tempFilters.rating ? "#FFB300" : "#888"}
                          style={styles.starIcon}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sort By */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Sort By</Text>
                  <View style={styles.filterOptions}>
                    {['Default', 'Price: Low to High', 'Price: High to Low', 'Rating'].map((sort) => (
                      <TouchableOpacity
                        key={sort}
                        style={[
                          styles.filterOption,
                          tempFilters.sortBy === sort.toLowerCase() && styles.filterOptionSelected
                        ]}
                        onPress={() => setTempFilters({...tempFilters, sortBy: sort.toLowerCase()})}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          tempFilters.sortBy === sort.toLowerCase() && styles.filterOptionTextSelected
                        ]}>{sort}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    setTempFilters({
                      priceRange: 'all',
                      rating: 0,
                      sortBy: 'default'
                    });
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={async () => {
                    await applyFilters();
                    setIsFilterVisible(false);
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No food items found</Text>
      <Text style={styles.emptyStateSubtext}>
        Try selecting a different category
      </Text>
    </View>
  );

  // Helper to calculate average rating for a food item
  const getAverageRating = (item) => {
    if (Array.isArray(item.reviews) && item.reviews.length > 0) {
      const total = item.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      return total / item.reviews.length;
    }
    return null;
  };

  // Find the best seller (highest average rating)
  const bestSeller = React.useMemo(() => {
    if (!foodItems.length) return null;
    let maxAvg = -1;
    let best = null;
    foodItems.forEach(item => {
      const avg = getAverageRating(item);
      if (avg !== null && avg > maxAvg) {
        maxAvg = avg;
        best = item;
      }
    });
    return best;
  }, [foodItems]);

  // Handler for 'View All' in Best Seller section
  const handleViewAllBestSellers = () => {
    setSelectedCategory('All');
  };

  // Handler for clicking best seller image
  const handleBestSellerPress = () => {
    if (bestSeller) {
      navigation.navigate('FoodDetailScreen', { item: bestSeller });
    }
  };

  if (loading) {
    return (
      <SafeAreaViewContext style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading delicious food...</Text>
      </SafeAreaViewContext>
    );
  }

  return (
    <SafeAreaViewContext style={styles.container} edges={["top","left","right"]}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Best Seller</Text>
          <TouchableOpacity onPress={handleViewAllBestSellers}>
            <Text style={styles.sectionViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {/* Dynamic best seller card */}
        {bestSeller && (
          <TouchableOpacity style={styles.featuredCard} onPress={handleBestSellerPress} activeOpacity={0.85}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: bestSeller.image }}
                style={styles.featuredImage}
              />
              {/* Average rating star and value top left */}
              <View style={styles.featuredStar}>
                <Ionicons name="star" size={18} color="#FFB300" />
                <Text style={styles.featuredStarText}>
                  {getAverageRating(bestSeller)?.toFixed(2) ?? 'N/A'}
                </Text>
              </View>
              {/* Cart button top right */}
              <TouchableOpacity style={styles.featuredCartOverlay} onPress={(e) => { e.stopPropagation(); handleAddToCart(bestSeller); }}>
                <Ionicons name="cart-outline" size={22} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <View style={styles.featuredInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredTitle}>{bestSeller.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllFoodScreen')}>
            <Text style={styles.sectionViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {/* Render food items here */}
        {foodItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={foodItems.filter(item => item && typeof item === 'object')}
            keyExtractor={item => item.id?.toString() || item._id?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.gridListContainer}
            scrollEnabled={false} // Prevent FlatList from scrolling inside ScrollView
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'flex-start', marginLeft: 0, marginRight: 0 }}
          />
        )}
      </ScrollView>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f6f6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingHello: {
    fontSize: 20,
    fontWeight: '400',
    color: '#222',
    marginBottom: -4,
    letterSpacing: 0.1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingHelloBold: {
    fontWeight: '700',
    color: '#222',
    fontSize: 20,
    letterSpacing: 0.2,
  },
  greetingWave: {
    fontSize: 22,
    marginLeft: 2,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#181818',
    marginTop: 0,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 10,
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  sectionViewAll: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    paddingBottom: 12,
  },
  featuredImage: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginBottom: 10,
  },
  featuredInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginRight: 6,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  featuredRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    marginBottom: 0,
  },
  featuredRatingText: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
    marginLeft: 2,
  },
  featuredRatingCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  featuredDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  featuredDetail: {
    fontSize: 13,
    color: '#2ecc40',
    marginRight: 16,
  },
  featuredTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  featuredTag: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  featuredStar: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  featuredStarText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    marginLeft: 4,
  },
  featuredCartOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f6f6f6',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#FF6B35',
  },
  filterOptionText: {
    color: '#666',
    fontSize: 14,
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#222',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#FF6B35',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  resetButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen; 