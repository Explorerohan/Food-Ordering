import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, ImageBackground, TouchableOpacity } from 'react-native';

const BUTTON_COLOR = '#4CAF50'; // Consistent green color for all buttons

const offers = [
  {
    id: 1,
    title: 'Exclusive Welcome Offer!',
    description: 'Get 50% OFF on your first order above $30\nUse code: FIRST50\nValid for all menu items',
    backgroundImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    validUntil: 'Valid for first-time users only',
    tag: 'BEST DEAL'
  },
  {
    id: 2,
    title: 'Free Premium Delivery',
    description: 'Free delivery on all orders above $20\nNo code needed\nInstant discount applied at checkout',
    backgroundImage: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80',
    validUntil: 'Limited time offer',
    tag: 'FREE DELIVERY'
  },
  {
    id: 3,
    title: 'Weekend Special Deal',
    description: 'Buy 1 Get 1 Free on all beverages\nValid every Sat & Sun\nAll premium drinks included',
    backgroundImage: 'https://images.unsplash.com/photo-1481671703460-040cb8a2d909?auto=format&fit=crop&w=800&q=80',
    validUntil: 'Every weekend',
    tag: 'WEEKEND OFFER'
  },
];

const { width } = Dimensions.get('window');

const OffersCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  
  const [position1] = useState(new Animated.Value(0));
  const [position2] = useState(new Animated.Value(width));
  const [activePosition, setActivePosition] = useState(position1);
  const [waitingPosition, setWaitingPosition] = useState(position2);

  useEffect(() => {
    const interval = setInterval(animateNextSlide, 2000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const animateNextSlide = () => {
    waitingPosition.setValue(width);

    Animated.parallel([
      Animated.timing(activePosition, {
        toValue: -width,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(waitingPosition, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      const temp = activePosition;
      setActivePosition(waitingPosition);
      setWaitingPosition(temp);
      setActiveIndex((prev) => (prev + 1) % offers.length);
      setNextIndex((prev) => (prev + 1) % offers.length);
    });
  };

  const renderOffer = (offer, position) => (
    <Animated.View
      style={[
        styles.offerCard,
        {
          transform: [{ translateX: position }],
        },
      ]}
    >
      <ImageBackground
        source={{ uri: offer.backgroundImage }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{offer.title}</Text>
            <Text style={styles.description}>{offer.description}</Text>
            <Text style={styles.validUntil}>{offer.validUntil}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.tagButton}
            >
              <Text style={styles.tagButtonText}>{offer.tag}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.carouselContainer}>
        {renderOffer(offers[activeIndex], activePosition)}
        {renderOffer(offers[nextIndex], waitingPosition)}
      </View>

      <View style={styles.dotsContainer}>
        {offers.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)' },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 10,
    height: 180,
  },
  carouselContainer: {
    overflow: 'hidden',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    borderRadius: 12,
  },
  overlay: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Light dark overlay for text readability
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BUTTON_COLOR,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
    fontWeight: '600',
  },
  validUntil: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
    fontWeight: '500',
  },
  offerCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    width: '100%',
    zIndex: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default OffersCarousel; 