// src/components/CustomAlert.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose,
  onConfirm,
  onCancel,
}) => {
  // Use either buttons array or onConfirm/onCancel props
  const finalButtons = buttons || (onConfirm ? [
    { text: 'Confirm', onPress: onConfirm, style: 'default' },
    { text: 'Cancel', onPress: onCancel || (() => {}), style: 'cancel' }
  ] : [{ text: 'OK', onPress: onClose || (() => {}), style: 'default' }]);
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#047603';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#047603';
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'alert-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const handleButtonPress = (onPress: () => void) => {
    onPress();
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <LinearGradient
            colors={['#ffffff', '#f9fafb']}
            style={styles.alertContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIconName() as any}
                size={50}
                color={getIconColor()}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {finalButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.buttonCancel,
                    button.style === 'destructive' && styles.buttonDestructive,
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.buttonCancelText,
                      button.style === 'destructive' && styles.buttonDestructiveText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 15,
  },
  alertContent: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#047603',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#e2e8f0',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonCancelText: {
    color: '#0f172a',
  },
  buttonDestructiveText: {
    color: '#ffffff',
  },
});

export default CustomAlert;