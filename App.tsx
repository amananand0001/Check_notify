/**
 * WhatsApp-like Notification App
 * React Native app with Firebase Cloud Messaging
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/NotificationService';

function App() {
  useEffect(() => {
    initializeApp();
    
    return () => {
      NotificationService.destroy();
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing WhatsApp Notification App...');
      await NotificationService.initialize();
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize notifications. Some features may not work properly.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#128C7E" barStyle="light-content" />
      <AppNavigator />
    </>
  );
}

export default App;
