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
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="normal"
          snapToAlignment="start"
          bounces={true}
          alwaysBounceHorizontal={false}
          automaticallyAdjustContentInsets={false}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 0,
    borderBottomWidth: 0, 
  },
  scrollContainer: {
    overflow: 'hidden',
    marginHorizontal: 16, 
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    paddingRight: 0, 
  },
  categoryButton: {
    width: 80,
    height: 100,
    marginRight: 1,
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