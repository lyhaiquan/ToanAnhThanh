import { config } from '../../config.js';
import type { StorageProvider } from './provider.js';
import { LocalStorageProvider } from './local.js';
import { GoogleDriveProvider } from './gdrive.js';

let instance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!instance) {
    instance = config.storageProvider === 'gdrive' ? new GoogleDriveProvider() : new LocalStorageProvider();
  }
  return instance;
}
