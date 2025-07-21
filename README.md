# WhatsApp-like Notification App

A React Native application that demonstrates real-time push notifications similar to WhatsApp, with support for Android 15, deep linking, badge counts, and local notification storage.

## Features

✅ **Real-time Push Notifications** - Firebase Cloud Messaging integration  
✅ **Background/Foreground Handling** - Notifications work when app is closed or in background  
✅ **Native Android Module** - Custom Java/Kotlin module for advanced notification handling  
✅ **Deep Linking** - Click notifications to open specific screens  
✅ **Badge Counts** - WhatsApp-like unread message indicators  
✅ **Local Storage** - Persistent notification history  
✅ **Backend Simulation** - Test server for triggering notifications  
✅ **Android 15 Support** - Compatible with latest Android version  
✅ **WhatsApp-like UI** - Familiar chat interface  

## Architecture

```
├── React Native App (Frontend)
│   ├── Firebase Cloud Messaging
│   ├── Navigation (React Navigation)
│   ├── Local Storage (AsyncStorage)
│   └── Custom Native Module
├── Native Android Module (Java/Kotlin)
│   ├── NotificationService (FCM Handler)
│   ├── NotificationModule (RN Bridge)
│   └── Deep Link Handler
└── Backend Server (Node.js)
    ├── Express API
    ├── Notification Endpoints
    └── Device Management
```

## Prerequisites

- Node.js 16+
- React Native CLI
- Android Studio
- Java 17+
- Android SDK (API 33+)

## Installation

### 1. Clone and Setup

```bash
git clone <repository>
cd WhatsAppNotificationApp
npm install
```

### 2. Android Setup

```bash
# Install Android dependencies
cd android
./gradlew clean
cd ..
```

### 3. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will run on `http://localhost:3000`

## Running the App

### Development Mode

```bash
# Start Metro bundler
npx react-native start

# Run on Android (in another terminal)
npx react-native run-android
```

### Production Build

```bash
cd android
./gradlew assembleRelease
```

## Project Structure

```
WhatsAppNotificationApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   │   ├── HomeScreen.js   # Main notification list
│   │   ├── ChatScreen.js   # Chat interface
│   │   └── TestNotificationsScreen.js
│   ├── services/           # Business logic
│   │   └── NotificationService.js
│   └── navigation/         # Navigation setup
├── android/
│   └── app/src/main/java/com/whatsappnotificationapp/
│       ├── NotificationService.kt    # FCM message handler
│       ├── NotificationModule.kt     # React Native bridge
│       └── NotificationPackage.kt    # Module registration
├── backend/                # Test server
│   ├── server.js          # Express server
│   └── package.json
└── firebase.json          # Firebase configuration
```

## Key Components

### 1. NotificationService.kt (Native Android)

Handles Firebase Cloud Messaging events:
- Receives push notifications
- Shows system notifications
- Manages deep linking
- Updates badge counts
- Stores notifications locally

### 2. NotificationModule.kt (React Native Bridge)

Provides JavaScript interface for:
- Getting FCM tokens
- Managing badge counts
- Subscribing to topics
- Handling deep links
- Clearing notifications

### 3. NotificationService.js (React Native)

JavaScript service that:
- Initializes FCM
- Handles foreground/background messages
- Manages local storage
- Provides event emitters
- Coordinates with native module

### 4. Backend Server (Node.js)

Test server providing:
- Send notifications to devices
- Topic-based notifications
- Call simulation
- Device registration
- Notification history

## Usage

### 1. Basic Setup

1. Start the backend server
2. Launch the React Native app
3. Copy the FCM token from the home screen
4. Use the test screen to send notifications

### 2. Testing Notifications

**From the App:**
- Go to "Test Notifications" screen
- Configure notification content
- Send test notifications
- Test deep linking

**From Backend API:**
```bash
curl -X POST http://localhost:3000/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_fcm_token",
    "title": "New Message",
    "body": "Hello from backend!",
    "data": {
      "chatId": "chat123",
      "sender": "John Doe"
    }
  }'
```

### 3. Deep Linking

Notifications can include deep link data:
```json
{
  "data": {
    "chatId": "chat123",
    "sender": "John Doe",
    "messageId": "msg456"
  }
}
```

Clicking the notification will open the chat screen with the specified data.

### 4. Badge Management

```javascript
// Get current badge count
const count = await NotificationService.getBadgeCount();

// Update badge count
await NotificationService.updateBadgeCount(5);

// Clear badge
await NotificationService.clearBadgeCount();
```

## API Endpoints

### Backend Server Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| POST | `/send-notification` | Send notification to device |
| POST | `/send-topic-notification` | Send to topic subscribers |
| POST | `/simulate-call` | Simulate call notification |
| POST | `/register-device` | Register device token |
| GET | `/devices` | List registered devices |
| GET | `/notifications` | Notification history |
| GET | `/health` | Health check |

## Firebase Configuration

The app includes a mock Firebase configuration. For production:

1. Create a Firebase project
2. Add Android app to project
3. Download `google-services.json`
4. Replace the mock file in `android/app/`
5. Update Firebase configuration

## Android Permissions

Required permissions (automatically added):
- `POST_NOTIFICATIONS` (Android 13+)
- `INTERNET`
- `WAKE_LOCK`
- `VIBRATE`
- `RECEIVE_BOOT_COMPLETED`

## Troubleshooting

### Common Issues

1. **Notifications not received:**
   - Check FCM token is valid
   - Verify Firebase configuration
   - Ensure app has notification permissions

2. **Deep linking not working:**
   - Check intent filters in AndroidManifest.xml
   - Verify notification data format
   - Test with `adb shell am start` command

3. **Badge count not updating:**
   - Check if launcher supports badges
   - Verify native module is properly linked
   - Test on different devices/launchers

### Debug Commands

```bash
# Check if app is receiving notifications
adb logcat | grep NotificationService

# Test deep linking manually
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "whatsappnotification://chat?chatId=test123" \
  com.whatsappnotificationapp

# Check notification permissions
adb shell dumpsys notification
```

## Production Considerations

1. **Security:**
   - Implement proper authentication
   - Validate notification data
   - Use HTTPS for backend

2. **Performance:**
   - Optimize notification handling
   - Implement proper error handling
   - Add retry mechanisms

3. **Scalability:**
   - Use proper database for storage
   - Implement rate limiting
   - Add monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes and demonstrates React Native push notification implementation.