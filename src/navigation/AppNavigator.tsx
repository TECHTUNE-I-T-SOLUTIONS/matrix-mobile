// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useSession } from '../contexts/SessionContext';

// Import auth screens and auth navigator
import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from '../screens/auth/AuthNavigator';
import AuthResumeScreen from '../screens/auth/AuthResumeScreen';
import KYCScreen from '../screens/auth/KYCScreen';

import DashboardLayout from '../screens/dashboard/DashboardLayout';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('[AppNavigator] Session state update:', {
      isAuthenticated: session.isAuthenticated,
      requiresResumeAuth: session.requiresResumeAuth,
      isLoading: session.isLoading,
      isReady,
    });
  }, [session.isAuthenticated, session.requiresResumeAuth, session.isLoading, isReady]);

  // Determine initial route - ALWAYS start with Splash
  // Let the SplashScreen handle navigation based on session state
  let initialRoute: keyof RootStackParamList = 'Splash';

  console.log('[AppNavigator] Calculated initialRoute:', initialRoute, 'for session:', {
    isAuthenticated: session.isAuthenticated,
    requiresResumeAuth: session.requiresResumeAuth,
    isLoading: session.isLoading,
  });

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {!session.isAuthenticated && !session.requiresResumeAuth ? (
          <>
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="KYC"
              component={KYCScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </>
        ) : session.requiresResumeAuth ? (
          <>
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="AuthResume"
              component={AuthResumeScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={DashboardLayout}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="KYC"
              component={KYCScreen}
              options={{
                gestureDirection: 'horizontal-inverted',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;