import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

const TestNotificationsScreen = ({ navigation }) => {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test notification from the backend');
  const [chatId, setChatId] = useState('test-chat-123');
  const [sender, setSender] = useState('Test User');
  const [fcmToken, setFcmToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFcmToken();
    loadSavedSettings();
  }, []);

  const loadFcmToken = async () => {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      if (token) {
        setFcmToken(token);
      }
    } catch (error) {
      console.error('Error loading FCM token:', error);
    }
  };

  const loadSavedSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('test_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setServerUrl(settings.serverUrl || serverUrl);
        setTitle(settings.title || title);
        setBody(settings.body || body);
        setChatId(settings.chatId || chatId);
        setSender(settings.sender || sender);
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = { serverUrl, title, body, chatId, sender };
      await AsyncStorage.setItem('test_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const sendTestNotification = async () => {
    if (!fcmToken) {
      Alert.alert('Error', 'FCM token not available');
      return;
    }

    setIsLoading(true);
    await saveSettings();

    try {
      const response = await fetch(`${serverUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          title,
          body,
          data: {
            chatId,
            sender,
            messageId: Date.now().toString(),
          },
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Test notification sent successfully!');
      } else {
        const errorText = await response.text();
        Alert.alert('Error', `Failed to send notification: ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendLocalNotification = () => {
    // Simulate a local notification for testing
    const notification = {
      id: Date.now().toString(),
      title,
      body,
      data: { chatId, sender, messageId: Date.now().toString() },
      timestamp: Date.now(),
      read: false,
    };

    // Manually trigger the notification handler
    NotificationService.eventEmitter.emit('onNewNotification', notification);
    Alert.alert('Success', 'Local test notification triggered!');
  };

  const testDeepLink = () => {
    const data = {
      chatId,
      sender,
      messageId: Date.now().toString(),
    };

    NotificationService.eventEmitter.emit('onNavigateToChat', data);
    Alert.alert('Success', 'Deep link test triggered!');
  };

  const subscribeToTestTopic = async () => {
    try {
      await NotificationService.subscribeToTopic('test-topic');
      Alert.alert('Success', 'Subscribed to test-topic');
    } catch (error) {
      Alert.alert('Error', `Failed to subscribe: ${error.message}`);
    }
  };

  const copyTokenToClipboard = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert(
      'FCM Token',
      fcmToken,
      [
        { text: 'OK' },
        {
          text: 'Copy',
          onPress: () => {
            // Clipboard.setString(fcmToken);
            Alert.alert('Info', 'Token copied to clipboard (simulated)');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#128C7E" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Notifications</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <TouchableOpacity onPress={copyTokenToClipboard}>
          <Text style={styles.tokenText} numberOfLines={3}>
            {fcmToken || 'Loading...'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Server</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="Backend server URL"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Content</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder="Notification body"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deep Link Data</Text>
        <TextInput
          style={styles.input}
          value={chatId}
          onChangeText={setChatId}
          placeholder="Chat ID"
        />
        <TextInput
          style={styles.input}
          value={sender}
          onChangeText={setSender}
          placeholder="Sender name"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={sendTestNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send Backend Notification'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={sendLocalNotification}
        >
          <Text style={styles.buttonText}>Send Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={testDeepLink}
        >
          <Text style={styles.buttonText}>Test Deep Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={subscribeToTestTopic}
        >
          <Text style={styles.buttonText}>Subscribe to Test Topic</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Instructions:</Text>
        <Text style={styles.infoText}>
          1. Make sure the backend server is running{'\n'}
          2. Copy the FCM token and use it in your backend{'\n'}
          3. Test different notification scenarios{'\n'}
          4. Check deep linking functionality{'\n'}
          5. Verify badge count updates
        </Text>
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#25D366',
  },
  secondaryButton: {
    backgroundColor: '#128C7E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default TestNotificationsScreen;