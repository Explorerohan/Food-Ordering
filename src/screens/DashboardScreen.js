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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import FoodItemCard from '../components/FoodItemCard';
import CategoryFilter from '../components/CategoryFilter';
import { foodApi, mockFoodData } from '../services/api';

const DashboardScreen = ({ username }) => {
  const navigation = useNavigation();
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);

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
      // Add 'All' at the beginning
      setCategories([{ name: 'All', image: null }, ...apiCategories]);
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
    if (selectedCategory === 'All') {
      setFilteredItems(foodItems);
    } else {
      const filtered = foodItems.filter(item => {
        const itemCategory = typeof item.category === 'object' 
          ? item.category.name 
          : item.category;
        return itemCategory === selectedCategory;
      });
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

  const renderItem = ({ item }) => (
    <FoodItemCard item={item} onPress={handleFoodItemPress} onAddToCart={handleAddToCart} />
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoodItems();
    setRefreshing(false);
  };

  const handleFoodItemPress = (item) => {
    navigation.navigate('FoodDetail', { item });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Hello, {username || 'User'}! 👋</Text>
          <Text style={styles.subtitle}>What would you like to eat today?</Text>
        </View>
        <View style={styles.headerIcons}>
          <Ionicons name="search-outline" size={24} color="#333" style={{ marginHorizontal: 6 }} />
          <Ionicons name="notifications-outline" size={24} color="#333" style={{ marginHorizontal: 6 }} />
        </View>
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
      <FlatList
        ListHeaderComponent={
          <>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </>
        }
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
  header: {
    backgroundColor: '#fff',
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 8,
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