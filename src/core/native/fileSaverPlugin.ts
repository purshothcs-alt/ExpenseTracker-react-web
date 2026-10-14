import { registerPlugin } from '@capacitor/core';

export interface FileSaverPluginApi {
  /**
   * Opens Android's "save as" picker and writes the text to the location the user chooses
   * (phone storage, Google Drive, ...). Resolves with saved=false if the user cancels.
   */
  saveTextFile(options: {
    filename: string;
    content: string;
    mimeType?: string;
  }): Promise<{ saved: boolean }>;
}

/**
 * JS-side handle for the native FileSaverPlugin (android/app/src/main/java/com/expensetracker/pro/FileSaverPlugin.kt).
 * Needed because the Android WebView cannot download blob URLs the way a browser does.
 * Callers must check Capacitor.isNativePlatform() first.
 */
export const FileSaver = registerPlugin<FileSaverPluginApi>('FileSaver');
