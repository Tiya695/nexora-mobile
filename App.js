import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { startSyncEngine, stopSyncEngine } from './src/lib/syncEngine';
import { registerForPushNotifications, savePushToken, addNotificationListener, addResponseListener } from './src/lib/notifications';
import { initSentry, setUserContext, clearUserContext } from './src/lib/sentry';
import { useAuthStore } from './src/stores/authStore';

initSentry();

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    startSyncEngine();
    return () => stopSyncEngine();
  }, []);

  useEffect(() => {
    if (!user) {
      clearUserContext();
      return;
    }

    setUserContext(user.id, user.phone);

    registerForPushNotifications().then((token) => {
      if (token) savePushToken(user.id, token);
    });

    const notifListener = addNotificationListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseListener = addResponseListener((response) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      notifListener.remove();
      responseListener.remove();
    };
  }, [user]);

  return <RootNavigator />;
}
