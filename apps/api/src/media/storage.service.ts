import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
export type StorageLocation = {
  storageProvider: 'LOCAL' | 'S3';
  storageBucket?: string | null;
};
@Injectable()
export class MediaStorage {
  private client?: S3Client;
  constructor(private readonly config: ConfigService) {}
  onModuleDestroy() {
    this.client?.destroy();
  }
  location(): StorageLocation {
    const provider =
      this.config.get<string>('MEDIA_STORAGE') ||
      (this.config.get('NODE_ENV') === 'production' ? 's3' : 'local');
    if (provider === 'local') return { storageProvider: 'LOCAL' };
    if (provider !== 's3')
      throw new ServiceUnavailableException('Invalid media storage provider');
    const bucket = this.config.get<string>('S3_BUCKET');
    if (!bucket)
      throw new ServiceUnavailableException(
        'S3 media storage is not configured',
      );
    return { storageProvider: 'S3', storageBucket: bucket };
  }
  private s3() {
    if (!this.client) {
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      if (
        endpoint &&
        new URL(endpoint).protocol !== 'https:' &&
        this.config.get('NODE_ENV') === 'production'
      )
        throw new ServiceUnavailableException('S3 endpoint must use HTTPS');
      this.client = new S3Client({
        region: this.config.get<string>('S3_REGION') || 'auto',
        ...(endpoint ? { endpoint } : {}),
        forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE') === 'true',
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
        maxAttempts: 2,
        ...(this.config.get('S3_ACCESS_KEY_ID')
          ? {
              credentials: {
                accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
                secretAccessKey: this.config.getOrThrow<string>(
                  'S3_SECRET_ACCESS_KEY',
                ),
              },
            }
          : {}),
      });
    }
    return this.client;
  }
  private path(key: string) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9/_\-.]*$/.test(key) ||
      key.split('/').some((p) => p === '..' || p === '.' || !p)
    )
      throw new Error('Invalid storage key');
    return resolve(
      this.config.get<string>('MEDIA_DIRECTORY') ||
        resolve(process.cwd(), 'uploads'),
      key,
    );
  }
  async put(
    location: StorageLocation,
    key: string,
    bytes: Buffer,
    mimeType: string,
  ) {
    if (location.storageProvider === 'S3') {
      await this.s3().send(
        new PutObjectCommand({
          Bucket: location.storageBucket!,
          Key: key,
          Body: bytes,
          ContentType: mimeType,
          CacheControl: 'private, no-store',
        }),
        { abortSignal: AbortSignal.timeout(20000) },
      );
    } else {
      const file = this.path(key);
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await writeFile(file, bytes, { flag: 'wx', mode: 0o600 });
    }
  }
  async get(location: StorageLocation, key: string) {
    if (location.storageProvider === 'LOCAL') return readFile(this.path(key));
    const object = await this.s3().send(
      new GetObjectCommand({ Bucket: location.storageBucket!, Key: key }),
      { abortSignal: AbortSignal.timeout(20000) },
    );
    if (!object.Body) throw new Error('Missing object');
    return Buffer.from(await object.Body.transformToByteArray());
  }
  async remove(location: StorageLocation, key: string) {
    if (location.storageProvider === 'S3')
      await this.s3().send(
        new DeleteObjectCommand({ Bucket: location.storageBucket!, Key: key }),
        { abortSignal: AbortSignal.timeout(20000) },
      );
    else await unlink(this.path(key));
  }
}
