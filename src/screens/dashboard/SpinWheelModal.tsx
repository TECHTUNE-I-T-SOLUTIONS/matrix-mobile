// src/screens/dashboard/SpinWheelModal.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import CustomAlert from '../../components/CustomAlert';

interface SpinWheelModalProps {
  visible: boolean;
  onClose: () => void;
  onSpinComplete: (amount: number) => Promise<number | void>;
  canSpin?: boolean;
}

const SpinWheelModal: React.FC<SpinWheelModalProps> = ({ visible, onClose, onSpinComplete, canSpin = true }) => {
  const { theme } = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;

  // The wheel is intentionally limited to N1 through N10.
  const segments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const colors = ['#dcfce7', '#d1fae5', '#bbf7d0', '#a7f3d0', '#86efac', '#6ee7b7', '#4ade80', '#34d399', '#22c55e', '#16a34a'];

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      const normalizedReward = Math.floor(Math.random() * 10) + 1;
      const segmentIndex = segments.indexOf(normalizedReward);
      const safeIndex = segmentIndex >= 0 ? segmentIndex : 0;

      if (normalizedReward <= 0) {
        setIsSpinning(false);
        return;
      }

      const rotations = Math.floor(Math.random() * 5) + 4;
      const segmentAngle = 360 / segments.length;
      const finalAngle = rotations * 360 - safeIndex * segmentAngle;

      Animated.timing(spinValue, {
        toValue: finalAngle,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsSpinning(false);
          setWonAmount(normalizedReward);
          setIsSubmitting(true);
          setAlertVisible(true);
          void onSpinComplete(normalizedReward)
            .catch((error) => {
              console.error('[SpinWheelModal] Failed to record spin:', error);
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        } else {
          setIsSpinning(false);
        }
      });
    } catch (error) {
      console.error('[SpinWheelModal] Spin failed:', error);
      setIsSpinning(false);
    }
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const renderWheel = () => {
    const size = 300;
    const radius = size / 2;
    const center = size / 2;

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {segments.map((segment, index) => {
            const startAngle = (index * 360) / segments.length;
            const endAngle = ((index + 1) * 360) / segments.length;

            const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
            const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
            const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
            const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

            const d = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;
            const textAngle = startAngle + (endAngle - startAngle) / 2;
            const textX = center + (radius * 0.7) * Math.cos((Math.PI * textAngle) / 180);
            const textY = center + (radius * 0.7) * Math.sin((Math.PI * textAngle) / 180);

            return (
              <G key={index}>
                <Path d={d} fill={colors[index]} stroke="#fff" strokeWidth="2" />
                <SvgText
                  x={textX}
                  y={textY}
                  fill="#1f2937"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                >
                  {segment}₦
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSpinning}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>Daily Spin Wheel</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Spin the wheel once a day to earn wallet bonuses!
          </Text>

          <View style={styles.wheelContainer}>
            <View style={styles.pointerContainer}>
              <Ionicons name="caret-down" size={40} color={theme.primary} style={styles.pointer} />
            </View>

            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              {renderWheel()}
            </Animated.View>
          </View>

          <TouchableOpacity
            style={[styles.spinButton, { backgroundColor: !canSpin || isSpinning || isSubmitting ? '#ccc' : '#10B981' }]}
            onPress={handleSpin}
            disabled={!canSpin || isSpinning || isSubmitting}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'SPINNING...' : isSubmitting ? 'RECORDING...' : !canSpin ? 'SPUN TODAY' : 'SPIN NOW'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title="Congratulations!"
        message={`You won ₦${wonAmount}!`}
        type="success"
        buttons={[
          {
            text: 'Awesome!',
            onPress: () => {
              setAlertVisible(false);
              onClose();
              spinValue.setValue(0);
              setIsSubmitting(false);
            },
            style: 'default',
          },
        ]}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  pointerContainer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
    alignItems: 'center',
  },
  pointer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  spinButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default SpinWheelModal;
