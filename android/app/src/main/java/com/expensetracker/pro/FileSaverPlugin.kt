package com.expensetracker.pro

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.IOException

/**
 * Saves a text file (the JSON data backup) to a location the user picks.
 * The WebView cannot download blob URLs like a desktop browser, so the JS
 * side hands the content over and this plugin writes it through the Storage
 * Access Framework. ACTION_CREATE_DOCUMENT needs no storage permission and
 * lets the user choose phone storage, Google Drive, or any other provider.
 */
@CapacitorPlugin(name = "FileSaver")
class FileSaverPlugin : Plugin() {

    @PluginMethod
    fun saveTextFile(call: PluginCall) {
        val filename = call.getString("filename")
        if (filename.isNullOrBlank() || call.getString("content") == null) {
            call.reject("filename and content are required")
            return
        }
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = call.getString("mimeType") ?: "application/json"
            putExtra(Intent.EXTRA_TITLE, filename)
        }
        startActivityForResult(call, intent, "onFileChosen")
    }

    @ActivityCallback
    private fun onFileChosen(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val uri = result.data?.data
        val ret = JSObject()
        if (result.resultCode != Activity.RESULT_OK || uri == null) {
            ret.put("saved", false)
            call.resolve(ret)
            return
        }
        try {
            val content = call.getString("content") ?: ""
            val stream = context.contentResolver.openOutputStream(uri)
                ?: throw IOException("Unable to open the chosen file")
            stream.use { it.write(content.toByteArray(Charsets.UTF_8)) }
            ret.put("saved", true)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to write file", e)
        }
    }
}
