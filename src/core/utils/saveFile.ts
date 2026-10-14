import { Capacitor } from '@capacitor/core';
import { FileSaver } from '@core/native/fileSaverPlugin';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Result is a data URL ("data:<type>;base64,<data>"); keep only the data part
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('File read error'));
    reader.readAsDataURL(blob);
  });

/**
 * Saves a file: a normal download in the browser, the system "save as" picker in the
 * Android app (whose WebView ignores blob downloads). Returns false if the user cancelled.
 */
export async function saveBlob(blob: Blob, filename: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const { saved } = await FileSaver.saveFile({
      filename,
      data: await blobToBase64(blob),
      mimeType: blob.type || 'application/octet-stream',
    });
    return saved;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
