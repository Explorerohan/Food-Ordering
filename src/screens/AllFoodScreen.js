
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FoodItemCard from '../components/FoodItemCard';
import CategoryFilter from '../components/CategoryFilter';

import { foodApi } from '../services/api';

import { useNavigation } from '@react-navigation/native';

const AllFoodScreen = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodRes, catRes] = await Promise.all([
          foodApi.getAllFoodItems(),
          foodApi.getAllCategories()
        ]);
        setFoodItems(foodRes);
        setCategories([
          { name: 'All', image: 'https://neat-food.com/cdn/shop/files/neat_emmapharaoh_19march24_12.jpg?v=1712845654&width=4498' },
          ...catRes
        ]);
      } catch (error) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter(item => {
        const itemCategory = typeof item.category === 'object' ? item.category.name : item.category;
        return itemCategory === selectedCategory;
      });

  const handleAddToCart = (item) => {
    // Implement add to cart logic or navigation if needed
  };

  const handleFoodItemPress = (item) => {
    // Implement navigation to food detail if needed
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.heading}>All Foods</Text>
        </View>
        <View style={styles.categoryRow}>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id?.toString() || item._id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <FoodItemCard item={item} onPress={handleFoodItemPress} onAddToCart={handleAddToCart} />
          )}
          contentContainerStyle={styles.gridListContainer}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'flex-start', marginLeft: 0, marginRight: 0 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No food items found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 2,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  backArrow: {
    padding: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'left',
  },
  categoryRow: {
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 0,
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
});

export default AllFoodScreen;
