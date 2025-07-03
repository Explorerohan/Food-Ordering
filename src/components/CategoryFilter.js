import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Removed backgroundColor, border, and padding to eliminate the background box
    // backgroundColor: '#fff',
    // paddingVertical: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
  },
  scrollContent: {
    paddingHorizontal: 0, // Remove extra horizontal padding
    paddingVertical: 0, // Remove extra vertical padding
    paddingLeft: 16, // Add left padding to align first category with food items
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#e0e0e0', // Darker, more visible oval background
    borderWidth: 0, // Remove border for unselected
    elevation: 0, // Remove shadow
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
});

export default CategoryFilter; 