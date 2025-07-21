const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for demo purposes
let connectedDevices = [];
let notificationHistory = [];

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Notification Backend Server',
    version: '1.0.0',
    endpoints: {
      'POST /send-notification': 'Send a notification to a specific device',
      'POST /send-topic-notification': 'Send a notification to a topic',
      'POST /register-device': 'Register a device token',
      'GET /devices': 'Get all registered devices',
      'GET /notifications': 'Get notification history',
      'POST /simulate-call': 'Simulate a WhatsApp-like call notification'
    }
  });
});

// Register device token
app.post('/register-device', (req, res) => {
  const { token, userId, deviceInfo } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const device = {
    token,
    userId: userId || 'anonymous',
    deviceInfo: deviceInfo || {},
    registeredAt: new Date().toISOString()
  };

  // Remove existing device with same token
  connectedDevices = connectedDevices.filter(d => d.token !== token);
  connectedDevices.push(device);

  console.log(`Device registered: ${userId || 'anonymous'}`);
  res.json({ message: 'Device registered successfully', deviceId: token.substring(0, 10) + '...' });
});

// Get all registered devices
app.get('/devices', (req, res) => {
  const devices = connectedDevices.map(d => ({
    deviceId: d.token.substring(0, 10) + '...',
    userId: d.userId,
    registeredAt: d.registeredAt
  }));
  
  res.json({ devices, count: devices.length });
});

// Send notification to specific device
app.post('/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const notification = {
    id: Date.now().toString(),
    token,
    title: title || 'New Message',
    body: body || 'You have a new message',
    data: data || {},
    sentAt: new Date().toISOString(),
    type: 'direct'
  };

  // Store in history
  notificationHistory.push(notification);

  // In a real app, you would use Firebase Admin SDK here
  console.log('Sending notification:', notification);
  
  // Simulate FCM response
  const response = {
    messageId: `msg_${Date.now()}`,
    success: true,
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data
  };

  res.json({
    message: 'Notification sent successfully',
    response,
    notificationId: notification.id
  });
});

// Send notification to topic
app.post('/send-topic-notification', async (req, res) => {
  const { topic, title, body, data } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const notification = {
    id: Date.now().toString(),
    topic,
    title: title || 'New Message',
    body: body || 'You have a new message',
    data: data || {},
    sentAt: new Date().toISOString(),
    type: 'topic'
  };

  // Store in history
  notificationHistory.push(notification);

  console.log('Sending topic notification:', notification);

  res.json({
    message: 'Topic notification sent successfully',
    notificationId: notification.id,
    topic
  });
});

// Simulate WhatsApp-like call notification
app.post('/simulate-call', async (req, res) => {
  const { token, callerName, callType } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const callNotification = {
    id: Date.now().toString(),
    token,
    title: `${callType || 'Voice'} call`,
    body: `Incoming ${callType || 'voice'} call from ${callerName || 'Unknown'}`,
    data: {
      type: 'call',
      callType: callType || 'voice',
      callerName: callerName || 'Unknown',
      callId: `call_${Date.now()}`,
      chatId: `chat_${callerName || 'unknown'}`,
      sender: callerName || 'Unknown'
    },
    sentAt: new Date().toISOString(),
    type: 'call'
  };

  notificationHistory.push(callNotification);

  console.log('Sending call notification:', callNotification);

  res.json({
    message: 'Call notification sent successfully',
    callId: callNotification.data.callId,
    notificationId: callNotification.id
  });
});

// Get notification history
app.get('/notifications', (req, res) => {
  const { limit = 50, type } = req.query;
  
  let notifications = notificationHistory;
  
  if (type) {
    notifications = notifications.filter(n => n.type === type);
  }
  
  notifications = notifications
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, parseInt(limit));

  res.json({
    notifications,
    count: notifications.length,
    total: notificationHistory.length
  });
});

// Clear notification history
app.delete('/notifications', (req, res) => {
  const count = notificationHistory.length;
  notificationHistory = [];
  
  res.json({
    message: 'Notification history cleared',
    clearedCount: count
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    connectedDevices: connectedDevices.length,
    notificationsSent: notificationHistory.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Notification Backend Server running on port ${PORT}`);
  console.log(`📱 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;