// src/components/ThemeToggle.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const getIcon = () => {
    return themeMode === 'light' ? 'white-balance-sunny' : 'moon-waning-crescent';
  };

  // const getLabel = () => {
  //   return themeMode === 'light' ? 'Light' : 'Dark';
  // };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: isDark ? '#3F793F' : '#e2e8f0',
          backgroundColor: isDark ? '#1A3A1A' : '#f1f5f9',
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getIcon()}
          size={18}
          color={themeMode === 'light' ? '#0E270E' : '#A5DFA5'}
        />
      </View>
      {/* <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
        {getLabel()}
      </Text> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginRight: 0,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ThemeToggle;