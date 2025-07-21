package com.whatsappnotificationapp

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessaging

class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotificationModule"
        const val NAME = "NotificationModule"
    }

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun getFCMToken(promise: Promise) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                promise.reject("TOKEN_ERROR", "Failed to get FCM token", task.exception)
                return@addOnCompleteListener
            }

            // Get new FCM registration token
            val token = task.result
            Log.d(TAG, "FCM Registration Token: $token")
            promise.resolve(token)
        }
    }

    @ReactMethod
    fun subscribeToTopic(topic: String, promise: Promise) {
        FirebaseMessaging.getInstance().subscribeToTopic(topic)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Subscribed to topic: $topic")
                    promise.resolve("Subscribed to $topic")
                } else {
                    Log.w(TAG, "Failed to subscribe to topic: $topic", task.exception)
                    promise.reject("SUBSCRIPTION_ERROR", "Failed to subscribe to topic", task.exception)
                }
            }
    }

    @ReactMethod
    fun unsubscribeFromTopic(topic: String, promise: Promise) {
        FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Unsubscribed from topic: $topic")
                    promise.resolve("Unsubscribed from $topic")
                } else {
                    Log.w(TAG, "Failed to unsubscribe from topic: $topic", task.exception)
                    promise.reject("UNSUBSCRIPTION_ERROR", "Failed to unsubscribe from topic", task.exception)
                }
            }
    }

    @ReactMethod
    fun getBadgeCount(promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("notifications", Context.MODE_PRIVATE)
        val count = sharedPref.getInt("count", 0)
        promise.resolve(count)
    }

    @ReactMethod
    fun setBadgeCount(count: Int, promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("notifications", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putInt("count", count)
            apply()
        }
        
        // Update badge
        updateBadgeCount(count)
        promise.resolve("Badge count updated to $count")
    }

    @ReactMethod
    fun clearBadgeCount(promise: Promise) {
        setBadgeCount(0, promise)
    }

    @ReactMethod
    fun getStoredNotifications(promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("notifications", Context.MODE_PRIVATE)
        val notifications = WritableNativeMap()
        
        notifications.putInt("count", sharedPref.getInt("count", 0))
        notifications.putString("latestTitle", sharedPref.getString("latest_title", ""))
        notifications.putString("latestBody", sharedPref.getString("latest_body", ""))
        notifications.putString("latestChatId", sharedPref.getString("latest_chatId", ""))
        notifications.putString("latestMessageId", sharedPref.getString("latest_messageId", ""))
        notifications.putString("latestSender", sharedPref.getString("latest_sender", ""))
        notifications.putDouble("latestTimestamp", sharedPref.getLong("latest_timestamp", 0).toDouble())
        
        promise.resolve(notifications)
    }

    @ReactMethod
    fun clearAllNotifications(promise: Promise) {
        // Clear from notification manager
        val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
        
        // Clear stored notifications
        val sharedPref = reactApplicationContext.getSharedPreferences("notifications", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            clear()
            apply()
        }
        
        // Clear badge
        updateBadgeCount(0)
        promise.resolve("All notifications cleared")
    }

    @ReactMethod
    fun handleDeepLink(data: ReadableMap, promise: Promise) {
        val chatId = data.getString("chatId")
        val messageId = data.getString("messageId")
        val sender = data.getString("sender")
        
        val params = WritableNativeMap()
        params.putString("chatId", chatId)
        params.putString("messageId", messageId)
        params.putString("sender", sender)
        
        // Send event to React Native
        sendEvent("onDeepLink", params)
        promise.resolve("Deep link handled")
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission
        // This is handled in React Native side, but we can check current status here
        val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
        
        promise.resolve(areNotificationsEnabled)
    }

    private fun updateBadgeCount(count: Int) {
        try {
            val intent = Intent("android.intent.action.BADGE_COUNT_UPDATE")
            intent.putExtra("badge_count", count)
            intent.putExtra("badge_count_package_name", reactApplicationContext.packageName)
            intent.putExtra("badge_count_class_name", "com.whatsappnotificationapp.MainActivity")
            reactApplicationContext.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating badge count", e)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Handle initial notification when app is opened from notification
    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        val activity = currentActivity
        if (activity != null) {
            val intent = activity.intent
            val extras = intent.extras
            
            if (extras != null) {
                val params = WritableNativeMap()
                extras.getString("chatId")?.let { params.putString("chatId", it) }
                extras.getString("messageId")?.let { params.putString("messageId", it) }
                extras.getString("sender")?.let { params.putString("sender", it) }
                extras.getString("action")?.let { params.putString("action", it) }
                
                if (params.hasKey("chatId")) {
                    promise.resolve(params)
                    return
                }
            }
        }
        
        promise.resolve(null)
    }
}