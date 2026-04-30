// src/screens/AuthChoiceScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
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
import ThemeToggle from '../../components/ThemeToggle';

const { width, height } = Dimensions.get('window');

type AuthChoiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AuthChoice'>;

const AuthChoiceScreen: React.FC = () => {
  const navigation = useNavigation<AuthChoiceScreenNavigationProp>();
  const { theme } = useTheme();

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const loginButtonScale = useRef(new Animated.Value(0.8)).current;
  const signupButtonScale = useRef(new Animated.Value(0.8)).current;

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
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Button animations
    Animated.stagger(200, [
      Animated.spring(loginButtonScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(signupButtonScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = () => {
    navigation.replace('Login');
  };

  const handleSignup = () => {
    navigation.replace('Signup');
  };

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {[...Array(15)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternDot,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                transform: [{ rotate: `${Math.random() * 360}deg` }],
              },
            ]}
          />
        ))}
      </View>

      {/* Header with Theme Toggle */}
      <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0)' }]}>
        <ThemeToggle />
      </View>

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
            source={require('../../../assets/images/AppLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Welcome Back
        </Animated.Text>

        {/* Animated Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleFade,
              transform: [
                {
                  translateY: subtitleFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Choose how you'd like to continue
        </Animated.Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                transform: [{ scale: loginButtonScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="login" size={24} color="#ffffff" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.loginButtonText}>Log In</Text>
                  <Text style={styles.loginButtonSubtext}>Access your account</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                transform: [{ scale: signupButtonScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.signupButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="account-plus" size={24} color="#047603" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                  <Text style={styles.signupButtonSubtext}>Create new account</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 10,
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
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#ffffff',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  buttonWrapper: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  buttonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  loginButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  signupButton: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  signupButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#047603',
  },
  signupButtonSubtext: {
    fontSize: 14,
    color: '#0a8f0a',
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 40,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default AuthChoiceScreen;