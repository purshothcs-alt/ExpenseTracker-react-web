import { Capacitor } from '@capacitor/core';
import db from '@core/database/db';
import { FileSaver } from '@core/native/fileSaverPlugin';

const BACKUP_APP_ID = 'ExpenseTrackerPro';
const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
  app: string;
  formatVersion: number;
  /** Database schema version the backup was taken from. */
  dbVersion: number;
  createdAt: string;
  tables: Record<string, unknown[]>;
}

/** Reads every table of the database into a single serializable object. */
export async function createBackup(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {};
  await db.transaction('r', db.tables, async () => {
    for (const table of db.tables) {
      tables[table.name] = await table.toArray();
    }
  });
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    dbVersion: db.verno,
    createdAt: new Date().toISOString(),
    tables,
  };
}

/** Parses and validates the text of a backup file. Throws an Error with a user-facing message. */
export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup file.');
  }
  const backup = parsed as Partial<BackupFile> | null;
  if (
    !backup ||
    backup.app !== BACKUP_APP_ID ||
    typeof backup.tables !== 'object' ||
    backup.tables === null ||
    Object.values(backup.tables).some((rows) => !Array.isArray(rows))
  ) {
    throw new Error('This file is not a backup created by this app.');
  }
  if ((backup.formatVersion ?? 0) > BACKUP_FORMAT_VERSION || (backup.dbVersion ?? 0) > db.verno) {
    throw new Error('This backup was created by a newer version of the app. Update the app first.');
  }
  return backup as BackupFile;
}

/**
 * Replaces ALL current data with the contents of the backup. Runs in one transaction,
 * so if anything fails the existing data is left untouched.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = backup.tables[table.name];
      if (rows && rows.length > 0) await table.bulkAdd(rows);
    }
  });
}

/**
 * Saves text as a file: a normal download in the browser, the system "save as" picker
 * in the Android app. Returns false if the user cancelled the picker.
 */
export async function saveTextFile(
  filename: string,
  content: string,
  mimeType = 'application/json',
): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const { saved } = await FileSaver.saveTextFile({ filename, content, mimeType });
    return saved;
  }
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
