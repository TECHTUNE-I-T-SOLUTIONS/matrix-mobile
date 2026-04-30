// src/screens/SplashScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { useSession } from '../contexts/SessionContext';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme } = useTheme();
  const { session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setMounted(true);

    // Start animations
    Animated.parallel([
      // Logo scale and fade in
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      // Text fade in and slide up
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Determine where to navigate based on session state
    const navigateAfterSplash = () => {
      if (session.isLoading) {
        // Still loading, wait a bit more
        setTimeout(navigateAfterSplash, 500);
        return;
      }

      const targetRoute: keyof RootStackParamList = session.requiresResumeAuth
        ? 'AuthResume'
        : session.isAuthenticated
          ? 'Main'
          : 'Auth';

      const params = targetRoute === 'Auth' ? { screen: 'AuthChoice' } : undefined;

      console.log('[SplashScreen] Navigating to:', targetRoute, 'Session state:', {
        isAuthenticated: session.isAuthenticated,
        requiresResumeAuth: session.requiresResumeAuth,
        isLoading: session.isLoading,
      });

      navigation.replace(targetRoute, params as any);
    };

    // Navigate after splash animation completes (3.5 seconds)
    const timer = setTimeout(() => {
      navigateAfterSplash();
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation, logoScale, logoOpacity, textOpacity, textTranslateY, session]);

  if (!mounted) {
    return (
      <LinearGradient
        colors={['#047603', '#0a8f0a']}
        style={styles.container}
      />
    );
  }

  return (
    <LinearGradient
      colors={[theme?.gradientStart || '#047603', theme?.gradientEnd || '#0a8f0a']}
      style={styles.container}
    >
      <View style={styles.content}>
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
            source={require('../../assets/images/AppLogo.png')}
            style={styles.logo}
            resizeMode="contain"
            onError={(error) => console.log('Image load error:', error)}
          />
        </Animated.View>

        {/* Animated App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>Matrix</Text>
          <Text style={styles.tagline}>Your Digital Wallet</Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  dot1: {
    // Animation delay handled in component logic
  },
  dot2: {
    // Animation delay handled in component logic
  },
  dot3: {
    // Animation delay handled in component logic
  },
});

export default SplashScreen;