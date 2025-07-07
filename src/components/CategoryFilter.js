import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
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
        {categories.map((categoryObj) => (
          <TouchableOpacity
            key={categoryObj.name}
            style={[
              styles.categoryButton,
              selectedCategory === categoryObj.name && styles.selectedCategory,
            ]}
            onPress={() => onSelectCategory(categoryObj.name)}
          >
            {categoryObj.image && (
              <Image
                source={{ uri: categoryObj.image.startsWith('http') ? categoryObj.image : `http://192.168.1.90:8000${categoryObj.image}` }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
            )}
            <Text
              style={[
                styles.categoryText,
                selectedCategory === categoryObj.name && styles.selectedCategoryText,
              ]}
            >
              {categoryObj.name}
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
    width: 80,
    height: 90,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    borderWidth: 0,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  categoryImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
});

export default CategoryFilter; 