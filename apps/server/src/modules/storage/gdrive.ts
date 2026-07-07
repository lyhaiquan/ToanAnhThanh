import type { StorageProvider, VideoStream } from './provider.js';

/**
 * Google Drive provider — khung sẵn sàng, cần credentials để kích hoạt.
 *
 * Cách kích hoạt khi có Google Drive:
 * 1. Tạo Service Account trên Google Cloud Console, bật Drive API.
 * 2. Chia sẻ thư mục Drive chứa video cho email của service account.
 * 3. Đặt biến môi trường:
 *      STORAGE_PROVIDER=gdrive
 *      GDRIVE_CREDENTIALS_PATH=./gdrive-service-account.json
 *      GDRIVE_FOLDER_ID=<id thư mục Drive>
 * 4. npm i googleapis trong apps/server, rồi hoàn thiện 3 method dưới bằng
 *    drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' }).
 *    videoRef lúc này là fileId trên Drive.
 */
export class GoogleDriveProvider implements StorageProvider {
  constructor() {
    if (!process.env.GDRIVE_CREDENTIALS_PATH || !process.env.GDRIVE_FOLDER_ID) {
      throw new Error(
        'GoogleDriveProvider cần GDRIVE_CREDENTIALS_PATH và GDRIVE_FOLDER_ID. ' +
          'Xem hướng dẫn trong apps/server/src/modules/storage/gdrive.ts'
      );
    }
  }

  save(_tempPath: string, _originalName: string): Promise<string> {
    throw new Error('GoogleDriveProvider.save chưa được kích hoạt — cần credentials (xem hướng dẫn trong file này).');
  }

  getSize(): number {
    throw new Error('GoogleDriveProvider.getSize chưa được kích hoạt — cần credentials.');
  }

  createReadStream(): VideoStream {
    throw new Error('GoogleDriveProvider.createReadStream chưa được kích hoạt — cần credentials.');
  }
}
