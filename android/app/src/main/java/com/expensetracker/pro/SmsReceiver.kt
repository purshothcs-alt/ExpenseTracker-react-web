package com.expensetracker.pro

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Listens for android.provider.Telephony.SMS_RECEIVED — the standard,
 * read-only broadcast every app holding RECEIVE_SMS gets for incoming SMS
 * (distinct from SMS_DELIVER, which only the user's default SMS app
 * receives). We deliberately never request READ_SMS or the default-SMS-app
 * role: RECEIVE_SMS plus this broadcast is enough to see new messages as
 * they arrive, and it keeps this app out of Google Play's stricter
 * "default SMS handler" review bucket.
 *
 * This receiver contains zero parsing/classification logic on purpose —
 * see SmsQueueStore's doc comment for why the message is queued rather
 * than processed here.
 */
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        if (messages.isEmpty()) return

        // A single SMS can arrive as multiple PDUs (concatenated long messages);
        // they all share one sender and should be joined back into one body.
        val sender = messages[0].originatingAddress ?: "UNKNOWN"
        val body = messages.joinToString(separator = "") { it.messageBody ?: "" }
        val timestamp = messages[0].timestampMillis

        if (body.isNotBlank()) {
            SmsQueueStore.enqueue(context.applicationContext, sender, body, timestamp)
        }
    }
}
