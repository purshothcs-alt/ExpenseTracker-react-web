package com.expensetracker.pro

import android.Manifest
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

/**
 * Thin bridge between the native SMS receiver and the JS SMS-import
 * pipeline (see the src/core/sms directory). Deliberately does no parsing/classification —
 * it only (a) reports/requests the RECEIVE_SMS permission and (b) hands
 * back whatever SmsReceiver has queued since the last drain. Everything
 * else — detection, bank parsing, dedup, account/category matching — stays
 * in TypeScript so there is exactly one implementation of that logic,
 * shared by the Share Target, manual-paste, and native paths alike.
 *
 * Only RECEIVE_SMS is requested — not READ_SMS and not the default-SMS-app
 * role — since Telephony.Sms.Intents.getMessagesFromIntent() reads the
 * message straight off the broadcast intent, never the SMS content
 * provider. That keeps this out of Play Store's stricter "default SMS
 * handler" review requirements.
 */
@CapacitorPlugin(
    name = "SmsImport",
    permissions = [Permission(strings = [Manifest.permission.RECEIVE_SMS], alias = "sms")],
)
class SmsImportPlugin : Plugin() {

    @PluginMethod
    fun drainQueue(call: PluginCall) {
        val queued = SmsQueueStore.drain(context.applicationContext)
        val messages = JSArray()
        for (i in 0 until queued.length()) {
            val entry = queued.getJSONObject(i)
            val obj = JSObject()
            obj.put("sender", entry.optString("sender"))
            obj.put("body", entry.optString("body"))
            obj.put("timestampMillis", entry.optLong("timestampMillis"))
            messages.put(obj)
        }
        val result = JSObject()
        result.put("messages", messages)
        call.resolve(result)
    }
}
