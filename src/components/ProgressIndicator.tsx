// src/components/ProgressIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
}) => {
  const { theme, isDark } = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  const getStepIcon = (step: number) => {
    if (step < currentStep) return '✅';
    if (step === currentStep) return '🔄';
    return '⭕';
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return theme.success;
    if (step === currentStep) return theme.primary;
    return theme.border;
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.primary,
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <View key={step} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted ? theme.success : isActive ? theme.primary : theme.surface,
                    borderColor: getStepColor(step),
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
              </View>
              {stepLabels[index] && (
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isActive ? theme.primary : theme.textSecondary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {stepLabels[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Progress Text */}
      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIcon: {
    fontSize: 16,
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ProgressIndicator;