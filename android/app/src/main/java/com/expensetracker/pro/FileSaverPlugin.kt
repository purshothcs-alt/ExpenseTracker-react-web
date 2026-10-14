package com.expensetracker.pro

import android.app.Activity
import android.content.Intent
import android.util.Base64
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.IOException

/**
 * Saves a file (data backup, PDF / Excel / CSV export) to a location the user picks.
 * The WebView cannot download blob URLs like a desktop browser, so the JS side
 * hands the content over base64-encoded and this plugin writes it through the
 * Storage Access Framework. ACTION_CREATE_DOCUMENT needs no storage permission
 * and lets the user choose phone storage, Google Drive, or any other provider.
 */
@CapacitorPlugin(name = "FileSaver")
class FileSaverPlugin : Plugin() {

    @PluginMethod
    fun saveFile(call: PluginCall) {
        val filename = call.getString("filename")
        if (filename.isNullOrBlank() || call.getString("data") == null) {
            call.reject("filename and data are required")
            return
        }
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = call.getString("mimeType") ?: "application/octet-stream"
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
            val bytes = Base64.decode(call.getString("data") ?: "", Base64.DEFAULT)
            val stream = context.contentResolver.openOutputStream(uri)
                ?: throw IOException("Unable to open the chosen file")
            stream.use { it.write(bytes) }
            ret.put("saved", true)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to write file", e)
        }
    }
}
