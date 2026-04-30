// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SessionProvider } from './src/contexts/SessionContext';
import { WalletBalanceProvider } from './src/contexts/WalletBalanceContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useUpdateChecker } from './src/hooks/useUpdateChecker';

function AppContent() {
  // Check for app updates on startup
  useUpdateChecker();
  
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <WalletBalanceProvider>
            <AppContent />
          </WalletBalanceProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
