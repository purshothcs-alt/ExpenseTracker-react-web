import { registerPlugin } from '@capacitor/core';

export interface FileSaverPluginApi {
  /**
   * Opens Android's "save as" picker and writes the file to the location the user chooses
   * (phone storage, Google Drive, ...). Resolves with saved=false if the user cancels.
   */
  saveFile(options: {
    filename: string;
    /** File content, base64-encoded. */
    data: string;
    mimeType?: string;
  }): Promise<{ saved: boolean }>;
}

/**
 * JS-side handle for the native FileSaverPlugin (android/app/src/main/java/com/expensetracker/pro/FileSaverPlugin.kt).
 * Needed because the Android WebView cannot download blob URLs the way a browser does.
 * Callers must check Capacitor.isNativePlatform() first (see core/utils/saveFile.ts).
 */
export const FileSaver = registerPlugin<FileSaverPluginApi>('FileSaver');
