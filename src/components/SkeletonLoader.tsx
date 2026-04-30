// src/components/SkeletonLoader.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  marginBottom?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width: w = '100%',
  height = 20,
  borderRadius = 4,
  style,
  marginBottom: mb = 0,
}) => {
  const { theme } = useTheme();
  const animValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animValue]);

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.inputBackground, theme.surface],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof w === 'number' ? w : w,
          height,
          borderRadius,
          backgroundColor: theme.inputBackground,
          marginBottom: mb,
        },
        { opacity: animValue },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <SkeletonLoader width="30%" height={20} marginBottom={12} />
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <SkeletonLoader
            key={i}
            width={i === lines - 1 ? '60%' : '100%'}
            height={16}
            style={{ marginBottom: i !== lines - 1 ? 8 : 0 }}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    marginBottom: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
