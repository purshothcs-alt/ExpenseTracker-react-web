package com.expensetracker.pro

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * A small durable hand-off buffer between the native SMS receiver and the
 * JS parsing pipeline. Everything that actually decides "is this a
 * transaction / which bank / what account" lives in TypeScript
 * (src/core/sms/*) — this class only exists because a BroadcastReceiver can
 * fire while the WebView/JS bridge isn't running (app killed or not yet
 * loaded), so the message has to be stashed somewhere until the JS layer
 * can drain it on next launch/resume.
 *
 * Deliberately minimal: SharedPreferences, capped size, capped age. The raw
 * SMS body only lives here for as long as it takes the app to next come to
 * the foreground and call drain() — after that it's gone from the native
 * side entirely (the JS-side privacy handling in
 * PendingSmsTransactionRepository takes over from there).
 */
object SmsQueueStore {
    private const val PREFS_NAME = "sms_import_queue"
    private const val KEY_QUEUE = "queue"
    private const val MAX_ENTRIES = 200
    private const val MAX_AGE_MILLIS = 7L * 24 * 60 * 60 * 1000 // 7 days

    fun enqueue(context: Context, sender: String, body: String, timestampMillis: Long) {
        synchronized(this) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val array = readArray(prefs)

            val entry = JSONObject()
            entry.put("sender", sender)
            entry.put("body", body)
            entry.put("timestampMillis", timestampMillis)
            array.put(entry)

            val trimmed = dropExpiredAndOverflow(array)
            prefs.edit().putString(KEY_QUEUE, trimmed.toString()).apply()
        }
    }

    /** Returns everything queued and clears the store. */
    fun drain(context: Context): JSONArray {
        synchronized(this) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val array = readArray(prefs)
            prefs.edit().remove(KEY_QUEUE).apply()
            return array
        }
    }

    private fun readArray(prefs: android.content.SharedPreferences): JSONArray {
        val raw = prefs.getString(KEY_QUEUE, null) ?: return JSONArray()
        return try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    private fun dropExpiredAndOverflow(array: JSONArray): JSONArray {
        val now = System.currentTimeMillis()
        val kept = JSONArray()
        val start = maxOf(0, array.length() - MAX_ENTRIES)
        for (i in start until array.length()) {
            val entry = array.getJSONObject(i)
            val ts = entry.optLong("timestampMillis", now)
            if (now - ts <= MAX_AGE_MILLIS) {
                kept.put(entry)
            }
        }
        return kept
    }
}
