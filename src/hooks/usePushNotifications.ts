import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../services/apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = (userId: string | undefined) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        // console.log('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'e9afd59e-b3ed-4a57-a242-704fa6ce8ead'
      })).data;
    } else {
      // console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    if (!userId) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Send token to backend
        apiClient.post('/user/update-push-token', { userId, token })
          .catch(err => console.error('Failed to sync push token:', err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle user interaction with notification
      // console.log(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { expoPushToken, notification };
};
