import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import NotificationService from '../services/NotificationService';

const HomeScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    initializeNotifications();
    setupListeners();
    
    return () => {
      NotificationService.removeAllListeners();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const token = await NotificationService.initialize();
      setFcmToken(token);
      await loadNotifications();
      await loadBadgeCount();
    } catch (error) {
      console.error('Error initializing notifications:', error);
      Alert.alert('Error', 'Failed to initialize notifications');
    }
  };

  const setupListeners = () => {
    // Listen for new notifications
    NotificationService.addListener('onNewNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      loadBadgeCount();
    });

    // Listen for navigation events
    NotificationService.addListener('onNavigateToChat', (data) => {
      navigation.navigate('Chat', { 
        chatId: data.chatId, 
        sender: data.sender,
        messageId: data.messageId 
      });
    });
  };

  const loadNotifications = async () => {
    try {
      const stored = await NotificationService.getStoredNotifications();
      setNotifications(stored.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadBadgeCount = async () => {
    try {
      const count = await NotificationService.getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      console.error('Error loading badge count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await loadBadgeCount();
    setRefreshing(false);
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAllNotifications();
      setNotifications([]);
      setBadgeCount(0);
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const clearBadgeCount = async () => {
    try {
      await NotificationService.clearBadgeCount();
      setBadgeCount(0);
      // Mark all notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      Alert.alert('Success', 'Badge count cleared');
    } catch (error) {
      console.error('Error clearing badge count:', error);
      Alert.alert('Error', 'Failed to clear badge count');
    }
  };

  const openChat = (notification) => {
    const data = notification.data || {};
    navigation.navigate('Chat', {
      chatId: data.chatId || 'default',
      sender: data.sender || 'Unknown',
      messageId: data.messageId,
      initialMessage: notification.body
    });
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => openChat(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title || 'New Message'}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body || 'You have a new message'}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#128C7E" barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatsApp Notifications</Text>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.tokenContainer}>
        <Text style={styles.tokenLabel}>FCM Token:</Text>
        <Text style={styles.tokenText} numberOfLines={1}>
          {fcmToken || 'Loading...'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={clearBadgeCount}>
          <Text style={styles.buttonText}>Clear Badge</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllNotifications}>
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('TestNotifications')}
        >
          <Text style={styles.buttonText}>Test</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Notifications will appear here when received
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#128C7E',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokenContainer: {
    backgroundColor: 'white',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  button: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#25D366',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;