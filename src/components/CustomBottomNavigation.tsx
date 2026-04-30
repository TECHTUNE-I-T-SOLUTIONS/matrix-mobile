// src/components/CustomBottomNavigation.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Component derives active route from navigation state now — no props needed.

interface NavItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  label: string;
}

const navItems: NavItem[] = [
  { name: 'home', icon: 'home', route: 'Dashboard', label: 'Home' },
  { name: 'services', icon: 'flash', route: 'Services', label: 'Services' },
  { name: 'wallet', icon: 'wallet', route: 'Wallet', label: 'Wallet' },
  { name: 'transactions', icon: 'swap-horizontal', route: 'Transactions', label: 'Transactions' },
  { name: 'profile', icon: 'person', route: 'Profile', label: 'Profile' },
];

const CustomBottomNavigation: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  // Subscribe to root navigation state and derive the active child route
  const activeRoute = useNavigationState((state: any) => {
    // Find the 'Main' route in the root state
    const mainRoute = state?.routes?.find((r: any) => r.name === 'Main');
    if (!mainRoute) {
      // If Main isn't present, fall back to the currently focused route at root
      return state?.routes?.[state.index]?.name ?? 'Dashboard';
    }

    const childState = mainRoute.state;
    if (!childState) return 'Dashboard';

    return childState.routes?.[childState.index ?? 0]?.name ?? 'Dashboard';
  });

  const handleNavigation = (route: string) => {
    // Navigate to screen in the Main (Dashboard) navigator
    navigation.navigate('Main', { screen: route });
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#035a03' : '#EAF7EA',
          borderTopColor: theme.border,
          paddingBottom: 16,
        },
      ]}
    >
      <View style={styles.navBarWrapper}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem,
                isActive && [
                  styles.activeNav,
                  { backgroundColor: theme.primary },
                ],
              ]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? '#ffffff' : theme.textSecondary}
                />
              </View>
              {isActive && (
                <View style={styles.labelWrapper}>
                  <View
                    style={[
                      styles.label,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    {/* Label can be added if needed */}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  navBarWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'relative',
  },
  activeNav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  label: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CustomBottomNavigation;
