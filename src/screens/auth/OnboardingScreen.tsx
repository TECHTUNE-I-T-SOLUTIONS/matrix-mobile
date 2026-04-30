// src/screens/OnboardingScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  iconName: string;
  gradient: [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Matrix',
    description: 'Your all-in-one mobile solutions app for digital wallet, virtual card management, and seamless transactions in Nigeria.',
    iconName: 'credit-card',
    gradient: ['#0a9f0b', '#0a9f0b'],
  },
  {
    id: '2',
    title: 'All Services In One',
    description: 'Pay bills, transfer money, buy airtime, manage virtual cards, and access multiple financial services with ease.',
    iconName: 'apps',
    gradient: ['#0a9f0b', '#0a9f0b'],
  },
  {
    id: '3',
    title: 'Secure & Private',
    description: 'Bank-level security with biometric authentication, encrypted transactions, and KYC verification for your peace of mind.',
    iconName: 'shield-check',
    gradient: ['#0a9f0b', '#0a9f0b'],
  },
  {
    id: '4',
    title: 'Get Started',
    description: 'Join thousands of Nigerians who trust Matrix for seamless digital solutions. Your journey to convenience begins now!',
    iconName: 'lightning-bolt',
    gradient: ['#0a9f0b', '#0a9f0b'],
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const descriptionFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Text animations
    Animated.sequence([
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);

    // Reset animations for new slide
    if (viewableItems[0]?.index !== undefined) {
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(titleFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(descriptionFade, {
            toValue: 1,
            duration: 500,
            delay: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = (index: number) => {
    if (slidesRef.current) {
      slidesRef.current.scrollToIndex({ index });
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      navigation.replace('AuthChoice');
    }
  };

  const handleSkip = () => {
    navigation.replace('AuthChoice');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.slideGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 1]}
    >
      <View style={styles.slide}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require('../../../assets/images/AppLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                {
                  scale: scrollX.interpolate({
                    inputRange: [
                      (currentIndex - 1) * width,
                      currentIndex * width,
                      (currentIndex + 1) * width,
                    ],
                    outputRange: [0.8, 1, 0.8],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name={item.iconName as any} size={64} color="#ffffff" />
        </Animated.View>

        {/* Animated Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleFade,
              transform: [
                {
                  translateY: titleFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {item.title}
        </Animated.Text>

        {/* Animated Description */}
        <Animated.Text
          style={[
            styles.description,
            {
              opacity: descriptionFade,
              transform: [
                {
                  translateY: descriptionFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {item.description}
        </Animated.Text>
      </View>
    </LinearGradient>
  );

  const renderDot = (index: number) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            transform: [{ scale }],
            opacity,
            backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.gradientStart }]}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slidesContainer}>
        <FlatList
          data={slides}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          scrollEventThrottle={32}
        />
      </View>

      <View style={[styles.footer, { backgroundColor: theme.gradientEnd }]}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => renderDot(index))}
        </View>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Get Started</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" style={styles.buttonIcon} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  slidesContainer: {
    flex: 1,
  },
  slideGradient: {
    width,
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
    color: '#ffffff',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    width: width * 0.8,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;