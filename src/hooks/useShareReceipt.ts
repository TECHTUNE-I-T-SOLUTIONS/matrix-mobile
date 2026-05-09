import { useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export const useShareReceipt = (transactionId?: string) => {
  const viewShotRef = useRef<ViewShot>(null);

  const shareReceipt = async () => {
    try {
      if (!viewShotRef.current) {
        throw new Error('Receipt template not ready');
      }

      // Capture the view
      if (!viewShotRef.current || !(viewShotRef.current as any).capture) {
        throw new Error('Capture method not available');
      }

      const uri = await (viewShotRef.current as any).capture({
        format: 'png',
        quality: 1.0,
      });

      // Rename file to something meaningful
      const fileName = `MATRIX_${transactionId || Date.now()}.png`;
      const newUri = (FileSystem.cacheDirectory as string) + fileName;
      await FileSystem.copyAsync({ from: uri, to: newUri });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the file
      await Sharing.shareAsync(newUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Transaction Receipt',
        UTI: 'public.png',
      });

    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to generate or share receipt');
    }
  };

  return {
    viewShotRef,
    shareReceipt,
  };
};
