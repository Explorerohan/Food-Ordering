import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View as RNView } from 'react-native';

const { width } = Dimensions.get('window');

const FoodItemCard = ({ item, onPress, onAddToCart }) => {
  const smallSize = item.sizes?.find(s => s.size === 'Small');
  let avgRating = null;
  let reviewCount = 0;
  
  if (Array.isArray(item.reviews) && item.reviews.length > 0) {
    const total = item.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    avgRating = (total / item.reviews.length);
    reviewCount = item.reviews.length;
  }

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Ionicons key={i} name="star" size={13} color="#FFB300" />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={13} color="#FFB300" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={13} color="#FFB300" />);
      }
    }
    return stars;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.imageBox}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {/* Price row */}
        <View style={styles.row}>
          <Text style={styles.price}>
            {smallSize ? `Rs. ${smallSize.price}` : 'N/A'}
          </Text>
        </View>
        {/* Reviews and cart button row */}
        <View style={styles.ratingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {avgRating !== null ? (
              <>
                {renderStars(avgRating)}
                <Text style={styles.ratingNumber}>{avgRating.toFixed(2)}</Text>
                <Text style={styles.reviewCount}>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</Text>
              </>
            ) : (
              <Text style={styles.noReviewsText}>No reviews</Text>
            )}
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={(e) => { e.stopPropagation(); onAddToCart(item); }}>
            <Ionicons name="cart-outline" size={18} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    width: (width - 48) / 2,
    padding: 0,
  },
  imageBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 170,
    height: 120,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 3,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B35',
  },
  cartBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 16,
    padding: 3,
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 3,
  },
  ratingNumber: {
    fontSize: 12,
    color: '#222',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    fontWeight: '400',
  },
  noReviewsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    fontStyle: 'italic',
  },
});

export default FoodItemCard; 