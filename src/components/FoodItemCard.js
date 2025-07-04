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

const { width } = Dimensions.get('window');

const FoodItemCard = ({ item, onPress, onAddToCart }) => {
  const smallSize = item.sizes?.find(s => s.size === 'Small');

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <Image source={{ uri: item.image }} style={styles.image} />
      
      <View style={styles.badgeContainer}>
        {item.isVegetarian && (
          <View style={[styles.badge, styles.vegetarianBadge]}>
            <Text style={styles.badgeText}>Veg</Text>
          </View>
        )}
        {item.isSpicy && (
          <View style={[styles.badge, styles.spicyBadge]}>
            <Ionicons name="flame" size={10} color="#FF4500" />
            <Text style={[styles.badgeText, styles.spicyText]}>Spicy</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>
            {smallSize ? `₹${smallSize.price}` : 'N/A'}
          </Text>
          <TouchableOpacity style={styles.cartBtn} onPress={(e) => { e.stopPropagation(); onAddToCart(item); }}>
            <Ionicons name="cart-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: (width - 48) / 2,
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  vegetarianBadge: {
    backgroundColor: '#4CAF50',
  },
  spicyBadge: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  spicyText: {
    color: '#FF4500',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  cartBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 20,
    padding: 6,
    marginLeft: 8,
  },
});

export default FoodItemCard; 