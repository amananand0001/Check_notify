# WhatsApp Notification Backend

This is a simple backend server for testing push notifications in the WhatsApp-like React Native app.

## Features

- Send notifications to specific devices
- Send notifications to topics
- Simulate WhatsApp-like call notifications
- Device registration
- Notification history
- RESTful API endpoints

## Installation

```bash
cd backend
npm install
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### GET /
Get API documentation and available endpoints.

### POST /register-device
Register a device token.

**Body:**
```json
{
  "token": "fcm_token_here",
  "userId": "user123",
  "deviceInfo": {
    "platform": "android",
    "version": "1.0.0"
  }
}
```

### POST /send-notification
Send a notification to a specific device.

**Body:**
```json
{
  "token": "fcm_token_here",
  "title": "New Message",
  "body": "Hello from the backend!",
  "data": {
    "chatId": "chat123",
    "sender": "John Doe",
    "messageId": "msg456"
  }
}
```

### POST /send-topic-notification
Send a notification to all devices subscribed to a topic.

**Body:**
```json
{
  "topic": "test-topic",
  "title": "Broadcast Message",
  "body": "This is a broadcast notification",
  "data": {
    "type": "broadcast",
    "priority": "high"
  }
}
```

### POST /simulate-call
Simulate a WhatsApp-like call notification.

**Body:**
```json
{
  "token": "fcm_token_here",
  "callerName": "John Doe",
  "callType": "video"
}
```

### GET /devices
Get all registered devices.

### GET /notifications
Get notification history.

**Query Parameters:**
- `limit`: Number of notifications to return (default: 50)
- `type`: Filter by notification type (direct, topic, call)

### DELETE /notifications
Clear notification history.

### GET /health
Health check endpoint.

## Testing with the React Native App

1. Start the backend server:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. In the React Native app, go to "Test Notifications" screen
3. Make sure the server URL is set to `http://localhost:3000` (or your server's IP)
4. Copy the FCM token from the app
5. Use the test buttons to send notifications

## Example Usage with curl

```bash
# Send a test notification
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_fcm_token_here",
    "title": "Test Message",
    "body": "This is a test notification",
    "data": {
      "chatId": "test-chat",
      "sender": "Test User"
    }
  }'

# Simulate a call
curl -X POST http://localhost:3000/simulate-call \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_fcm_token_here",
    "callerName": "Alice",
    "callType": "video"
  }'
```

## Notes

- This is a demo server and doesn't actually send FCM notifications
- In a real implementation, you would use Firebase Admin SDK
- The server stores data in memory, so it will be lost when restarted
- For production use, implement proper authentication and database storage