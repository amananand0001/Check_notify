package com.whatsappnotificationapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class NotificationService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "NotificationService"
        private const val CHANNEL_ID = "whatsapp_notifications"
        private const val CHANNEL_NAME = "WhatsApp Notifications"
        private const val CHANNEL_DESCRIPTION = "Notifications for WhatsApp-like messages"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            showNotification(it.title, it.body, remoteMessage.data)
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        
        // Send token to your app server
        sendRegistrationToServer(token)
    }

    private fun handleDataMessage(data: Map<String, String>) {
        val title = data["title"] ?: "New Message"
        val body = data["body"] ?: "You have a new message"
        val chatId = data["chatId"]
        val messageId = data["messageId"]
        val sender = data["sender"]
        
        showNotification(title, body, data)
        
        // Store notification locally for badge count
        storeNotificationLocally(title, body, chatId, messageId, sender)
    }

    private fun showNotification(title: String?, body: String?, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Add deep linking data
            data["chatId"]?.let { putExtra("chatId", it) }
            data["messageId"]?.let { putExtra("messageId", it) }
            data["sender"]?.let { putExtra("sender", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher))
            .setContentTitle(title ?: "WhatsApp Notification")
            .setContentText(body ?: "You have a new message")
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))

        // Add action buttons for WhatsApp-like experience
        val replyIntent = Intent(this, MainActivity::class.java).apply {
            putExtra("action", "reply")
            data["chatId"]?.let { putExtra("chatId", it) }
        }
        val replyPendingIntent = PendingIntent.getActivity(
            this, 1, replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        notificationBuilder.addAction(
            R.drawable.ic_notification,
            "Reply",
            replyPendingIntent
        )

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Update badge count
        updateBadgeCount()
        
        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun sendRegistrationToServer(token: String) {
        // TODO: Implement this method to send token to your app server
        Log.d(TAG, "sendTokenToServer($token)")
        
        // Store token locally for now
        val sharedPref = getSharedPreferences("fcm_token", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("token", token)
            apply()
        }
    }

    private fun storeNotificationLocally(title: String?, body: String?, chatId: String?, messageId: String?, sender: String?) {
        val sharedPref = getSharedPreferences("notifications", Context.MODE_PRIVATE)
        val notificationCount = sharedPref.getInt("count", 0) + 1
        
        with(sharedPref.edit()) {
            putInt("count", notificationCount)
            putString("latest_title", title)
            putString("latest_body", body)
            putString("latest_chatId", chatId)
            putString("latest_messageId", messageId)
            putString("latest_sender", sender)
            putLong("latest_timestamp", System.currentTimeMillis())
            apply()
        }
    }

    private fun updateBadgeCount() {
        val sharedPref = getSharedPreferences("notifications", Context.MODE_PRIVATE)
        val count = sharedPref.getInt("count", 0)
        
        // Update app icon badge (requires additional setup for different launchers)
        try {
            val intent = Intent("android.intent.action.BADGE_COUNT_UPDATE")
            intent.putExtra("badge_count", count)
            intent.putExtra("badge_count_package_name", packageName)
            intent.putExtra("badge_count_class_name", "com.whatsappnotificationapp.MainActivity")
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating badge count", e)
        }
    }
}