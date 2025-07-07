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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import FoodItemCard from '../components/FoodItemCard';
import CategoryFilter from '../components/CategoryFilter';
import { foodApi, mockFoodData } from '../services/api';

const API_BASE_URL = 'http://192.168.1.90:8000';

const DashboardScreen = ({ username }) => {
  const navigation = useNavigation();
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);

  // Add a static profile image and address for the top bar
  const staticProfileImage = 'https://randomuser.me/api/portraits/men/32.jpg';
  const staticAddress = 'Itahari-halgada';

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [foodItems, selectedCategory]);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const data = await foodApi.getAllFoodItems();
      setFoodItems(data);
      
      // Extract categories as objects with name and image
      const categoryMap = {};
      data.forEach(item => {
        if (item.category && item.category.name) {
          categoryMap[item.category.name] = item.category.image || null;
        } else if (item.category && typeof item.category === 'string') {
          categoryMap[item.category] = null;
        }
      });
      const apiCategories = Object.entries(categoryMap).map(([name, image]) => ({ name, image }));
      // Add 'All' at the beginning with the provided URL image
      setCategories([{ name: 'All', image: 'https://neat-food.com/cdn/shop/files/neat_emmapharaoh_19march24_12.jpg?v=1712845654&width=4498' }, ...apiCategories]);
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

  const filterItems = () => {
    // Map food items to ensure correct image URL and fields
    const mapItem = (item) => {
      let imageUrl = item.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = API_BASE_URL + imageUrl;
      }
      return {
        ...item,
        image: imageUrl,
        // Remove unsupported fields
        isVegetarian: undefined,
        isSpicy: undefined,
      };
    };

    if (selectedCategory === 'All') {
      setFilteredItems(foodItems.map(mapItem));
    } else {
      const filtered = foodItems.filter(item => {
        const itemCategory = typeof item.category === 'object' 
          ? item.category.name 
          : item.category;
        return itemCategory === selectedCategory;
      }).map(mapItem);
      setFilteredItems(filtered);
    }
  };

  // Group items by category for section headers
  const groupedItems = React.useMemo(() => {
    if (selectedCategory !== 'All') {
      return [{
        title: selectedCategory,
        data: filteredItems
      }];
    }

    const groups = {};
    foodItems.forEach(item => {
      const category = typeof item.category === 'object' 
        ? item.category.name 
        : item.category;
      
      if (!category || category === 'All') return; // Skip items with no category or 'All' category
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data
    }));
  }, [foodItems, filteredItems, selectedCategory]);

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const handleAddToCart = async (item) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.1.90:8000/api/cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ food_item_id: item.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      const cartData = await response.json();
      // Optionally store cartData in AsyncStorage or state for CartScreen
      await AsyncStorage.setItem('cart', JSON.stringify(cartData));
      Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
    } catch (error) {
      Alert.alert('Error', 'Could not add to cart. Please try again.');
    }
  };

  const renderItem = ({ item }) => {
    if (!item || typeof item !== 'object') return null;
    return <FoodItemCard item={item} onPress={handleFoodItemPress} onAddToCart={handleAddToCart} />;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoodItems();
    setRefreshing(false);
  };

  const handleFoodItemPress = (item) => {
    navigation.navigate('FoodDetail', { item });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={26} color="#222" />
        </TouchableOpacity>
        <View style={styles.addressContainer}>
          <Text style={styles.deliverToText}>Deliver to ▾</Text>
          <Text style={styles.addressText}>{staticAddress}</Text>
        </View>
        <TouchableOpacity style={styles.profileImageContainer}>
          <Image source={{ uri: staticProfileImage }} style={styles.profileImage} />
        </TouchableOpacity>
      </View>
      <Text style={styles.greetingHello}><Text style={styles.greetingHelloBold}>Hello Rohan!</Text> <Text style={styles.greetingWave}>👋</Text></Text>
      <Text style={styles.greetingTitle}>What would you like to order?</Text>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Find food or restaurant..."
            style={styles.searchInput}
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
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
          <TouchableOpacity>
            <Text style={styles.sectionViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {/* Sample best seller card */}
        <View style={styles.featuredCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredInfoRow}>
            <Text style={styles.featuredTitle}>Kfc's</Text>
            <View style={styles.featuredRatingRow}>
              <Ionicons name="star" size={16} color="#FFB300" />
              <Text style={styles.featuredRatingText}>4.5</Text>
              <Text style={styles.featuredRatingCount}>(25+)</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="heart-outline" size={22} color="#2ecc40" />
            </TouchableOpacity>
          </View>
          <View style={styles.featuredDetailsRow}>
            <Text style={styles.featuredDetail}><Ionicons name="bicycle" size={14} color="#2ecc40" /> Free delivery</Text>
            <Text style={styles.featuredDetail}><Ionicons name="time-outline" size={14} color="#2ecc40" /> 10-15 mins</Text>
          </View>
          <View style={styles.featuredTagsRow}>
            <Text style={styles.featuredTag}>Seafood</Text>
            <Text style={styles.featuredTag}>Snack</Text>
            <Text style={styles.featuredTag}>Dessert</Text>
            <Text style={styles.featuredTag}>Salmon Fish</Text>
          </View>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <TouchableOpacity>
            <Text style={styles.sectionViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {/* Render filtered food items here */}
        {filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredItems.filter(item => item && typeof item === 'object')}
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
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  menuButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f6f6f6',
  },
  addressContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  deliverToText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  greetingHello: {
    fontSize: 20,
    fontWeight: '400',
    color: '#222',
    marginBottom: 0,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#181818',
    marginBottom: 14,
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
    height: 140,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginBottom: 10,
  },
  featuredInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  featuredRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  featuredRatingText: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    marginLeft: 3,
  },
  featuredRatingCount: {
    fontSize: 13,
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
});

export default DashboardScreen; 