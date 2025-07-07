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
              numberOfLines={1}
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
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  categoryButton: {
    width: 72,
    height: 92,
    marginRight: 0,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  },
  selectedCategory: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedCategoryText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});

export default CategoryFilter; 