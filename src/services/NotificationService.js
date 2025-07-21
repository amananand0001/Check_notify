import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { NotificationModule } = NativeModules;

class NotificationService {
  constructor() {
    this.eventEmitter = new NativeEventEmitter(NotificationModule);
    this.listeners = [];
    this.setupNotificationListeners();
  }

  async initialize() {
    try {
      // Request permission for notifications
      await this.requestPermission();
      
      // Get FCM token
      const token = await this.getFCMToken();
      console.log('FCM Token:', token);
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      // Setup message handlers
      this.setupMessageHandlers();
      
      return token;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  async requestPermission() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs access to show notifications',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }
    
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    return enabled;
  }

  async getFCMToken() {
    try {
      if (NotificationModule && NotificationModule.getFCMToken) {
        return await NotificationModule.getFCMToken();
      } else {
        return await messaging().getToken();
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw error;
    }
  }

  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      await this.handleBackgroundMessage(remoteMessage);
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    this.listeners.push(unsubscribe);

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  setupNotificationListeners() {
    // Listen for deep link events from native module
    const deepLinkListener = this.eventEmitter.addListener('onDeepLink', (data) => {
      console.log('Deep link received:', data);
      this.handleDeepLink(data);
    });

    this.listeners.push(deepLinkListener);
  }

  async handleBackgroundMessage(remoteMessage) {
    // Store notification for later processing
    const notifications = await this.getStoredNotifications();
    const newNotifications = [...notifications, {
      id: Date.now().toString(),
      title: remoteMessage.notification?.title || remoteMessage.data?.title,
      body: remoteMessage.notification?.body || remoteMessage.data?.body,
      data: remoteMessage.data,
      timestamp: Date.now(),
      read: false
    }];
    
    await AsyncStorage.setItem('stored_notifications', JSON.stringify(newNotifications));
    
    // Update badge count
    await this.updateBadgeCount(newNotifications.filter(n => !n.read).length);
  }

  async handleForegroundMessage(remoteMessage) {
    // Show in-app notification or update UI
    const notification = {
      id: Date.now().toString(),
      title: remoteMessage.notification?.title || remoteMessage.data?.title,
      body: remoteMessage.notification?.body || remoteMessage.data?.body,
      data: remoteMessage.data,
      timestamp: Date.now(),
      read: false
    };

    // Store notification
    const notifications = await this.getStoredNotifications();
    const newNotifications = [...notifications, notification];
    await AsyncStorage.setItem('stored_notifications', JSON.stringify(newNotifications));

    // Emit event to update UI
    this.eventEmitter.emit('onNewNotification', notification);
    
    // Update badge count
    await this.updateBadgeCount(newNotifications.filter(n => !n.read).length);
  }

  handleNotificationOpen(remoteMessage) {
    const data = remoteMessage.data;
    if (data && data.chatId) {
      this.handleDeepLink(data);
    }
  }

  handleDeepLink(data) {
    // Emit event for navigation
    this.eventEmitter.emit('onNavigateToChat', data);
  }

  async subscribeToTopic(topic) {
    try {
      if (NotificationModule && NotificationModule.subscribeToTopic) {
        return await NotificationModule.subscribeToTopic(topic);
      } else {
        return await messaging().subscribeToTopic(topic);
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      if (NotificationModule && NotificationModule.unsubscribeFromTopic) {
        return await NotificationModule.unsubscribeFromTopic(topic);
      } else {
        return await messaging().unsubscribeFromTopic(topic);
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  async getBadgeCount() {
    try {
      if (NotificationModule && NotificationModule.getBadgeCount) {
        return await NotificationModule.getBadgeCount();
      } else {
        const notifications = await this.getStoredNotifications();
        return notifications.filter(n => !n.read).length;
      }
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async updateBadgeCount(count) {
    try {
      if (NotificationModule && NotificationModule.setBadgeCount) {
        await NotificationModule.setBadgeCount(count);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  async clearBadgeCount() {
    try {
      if (NotificationModule && NotificationModule.clearBadgeCount) {
        await NotificationModule.clearBadgeCount();
      }
      
      // Mark all notifications as read
      const notifications = await this.getStoredNotifications();
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }

  async getStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem('stored_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  async clearAllNotifications() {
    try {
      if (NotificationModule && NotificationModule.clearAllNotifications) {
        await NotificationModule.clearAllNotifications();
      }
      
      await AsyncStorage.removeItem('stored_notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  addListener(eventName, callback) {
    const listener = this.eventEmitter.addListener(eventName, callback);
    this.listeners.push(listener);
    return listener;
  }

  removeAllListeners() {
    this.listeners.forEach(listener => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
    this.listeners = [];
  }

  destroy() {
    this.removeAllListeners();
  }
}

export default new NotificationService();