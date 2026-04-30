import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import AuthLayout from './AuthLayout';
import OnboardingScreen from './OnboardingScreen';
import AuthChoiceScreen from './AuthChoiceScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import KYCScreen from './KYCScreen';

const AuthStack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <AuthLayout>
      <AuthStack.Navigator
        initialRouteName="AuthChoice"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
        <AuthStack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <AuthStack.Screen name="KYC" component={KYCScreen} />
      </AuthStack.Navigator>
    </AuthLayout>
  );
};

export default AuthNavigator;
