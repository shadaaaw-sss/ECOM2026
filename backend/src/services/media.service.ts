import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';

// Types
export interface UploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  filename?: string;
  contentType?: string;
  // Skip sharp image processing and upload the buffer as-is (e.g. video files).
  skipProcessing?: boolean;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: 'r2' | 'cloudflare-images';
  width?: number;
  height?: number;
  size: number;
  contentType: string;
}

export interface MediaService {
  upload(file: Buffer, options?: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

// Default upload options
const defaultUploadOptions: Required<UploadOptions> = {
  folder: 'uploads',
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
  format: 'jpeg',
  filename: '',
  contentType: 'image/jpeg',
  skipProcessing: false,
};

// R2/S3-compatible storage service
class R2StorageService implements MediaService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.storage.r2.endpoint,
      credentials: {
        accessKeyId: config.storage.r2.accessKeyId,
        secretAccessKey: config.storage.r2.secretAccessKey,
      },
    });
    this.bucketName = config.storage.r2.bucketName;
    this.publicUrl = config.storage.r2.publicUrl;
  }

  async upload(file: Buffer, options?: UploadOptions): Promise<UploadResult> {
    const opts = { ...defaultUploadOptions, ...options };

    let processedBuffer: Buffer;
    let contentType = opts.contentType;
    let width: number | undefined;
    let height: number | undefined;
    let ext: string;

    if (opts.skipProcessing) {
      // Non-image media (e.g. video): upload as-is, no sharp processing.
      processedBuffer = file;
      ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
    } else {
      // Process image with sharp
      try {
        const sharpInstance = sharp(file);
        const metadata = await sharpInstance.metadata();
        width = metadata.width;
        height = metadata.height;

        processedBuffer = await sharpInstance
          .resize(opts.maxWidth, opts.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          [opts.format]({ quality: opts.quality })
          .toBuffer();

        contentType = `image/${opts.format === 'jpeg' ? 'jpeg' : opts.format}`;
      } catch {
        processedBuffer = file;
      }
      ext = opts.format === 'jpeg' ? 'jpg' : opts.format;
    }

    // Generate unique key
    const filename = opts.filename || `${randomUUID()}-${Date.now()}.${ext}`;
    const key = `${opts.folder}/${filename}`;

    // Upload to R2
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: processedBuffer,
      ContentType: contentType,
      ACL: 'public-read',
    }));

    return {
      url: `${this.publicUrl}/${key}`,
      key,
      provider: 'r2',
      width,
      height,
      size: processedBuffer.length,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    }));
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

// Cloudflare Images service
class CloudflareImagesService implements MediaService {
  private accountId: string;
  private apiToken: string;
  private deliveryUrl: string;
  private apiBase: string;

  constructor() {
    this.accountId = config.storage.cloudflareImages.accountId;
    this.apiToken = config.storage.cloudflareImages.apiToken;
    this.deliveryUrl = config.storage.cloudflareImages.deliveryUrl;
    this.apiBase = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(`Cloudflare Images API error: ${JSON.stringify(data.errors || data)}`);
    }

    return data.result;
  }

  async upload(file: Buffer, options?: UploadOptions): Promise<UploadResult> {
    const opts = { ...defaultUploadOptions, ...options };

    // Process image with sharp
    let processedBuffer: Buffer;
    let contentType = opts.contentType;
    let width: number | undefined;
    let height: number | undefined;

    try {
      const sharpInstance = sharp(file);
      const metadata = await sharpInstance.metadata();
      width = metadata.width;
      height = metadata.height;

      processedBuffer = await sharpInstance
        .resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        [opts.format]({ quality: opts.quality })
        .toBuffer();

      contentType = `image/${opts.format === 'jpeg' ? 'jpeg' : opts.format}`;
    } catch {
      processedBuffer = file;
    }

    // Create form data for Cloudflare Images
    const formData = new FormData();
    const blob = new Blob([Uint8Array.from(processedBuffer)], { type: contentType });
    formData.append('file', blob, opts.filename || `image.${opts.format === 'jpeg' ? 'jpg' : opts.format}`);

    const result = await this.fetchApi('', {
      method: 'POST',
      body: formData,
    });

    const imageId = result.id;

    return {
      url: `${this.deliveryUrl}/${imageId}/public`,
      key: imageId,
      provider: 'cloudflare-images',
      width,
      height,
      size: processedBuffer.length,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    await this.fetchApi(`/${key}`, { method: 'DELETE' });
  }

  async getSignedUrl(key: string, _expiresIn = 3600): Promise<string> {
    // Cloudflare Images uses variants for signed URLs
    // For public images, just return the public URL
    return `${this.deliveryUrl}/${key}/public`;
  }

  getPublicUrl(key: string): string {
    return `${this.deliveryUrl}/${key}/public`;
  }
}

// Factory function
export function createMediaService(): MediaService {
  switch (config.storage.provider) {
    case 'cloudflare-images':
      if (!config.storage.cloudflareImages.accountId || !config.storage.cloudflareImages.apiToken) {
        console.warn('Cloudflare Images not configured, falling back to R2');
        return new R2StorageService();
      }
      return new CloudflareImagesService();
    case 'r2':
    default:
      return new R2StorageService();
  }
}

// Singleton instance
let mediaServiceInstance: MediaService | null = null;

export function getMediaService(): MediaService {
  if (!mediaServiceInstance) {
    mediaServiceInstance = createMediaService();
  }
  return mediaServiceInstance;
}

export function resetMediaService(): void {
  mediaServiceInstance = null;
}

// Helper to extract key from public URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // For R2: remove the public URL prefix
    if (config.storage.r2.publicUrl && url.startsWith(config.storage.r2.publicUrl)) {
      return url.replace(`${config.storage.r2.publicUrl}/`, '');
    }

    // For Cloudflare Images: extract the image ID
    if (config.storage.cloudflareImages.deliveryUrl && url.startsWith(config.storage.cloudflareImages.deliveryUrl)) {
      const parts = url.replace(`${config.storage.cloudflareImages.deliveryUrl}/`, '').split('/');
      return parts[0];
    }

    return urlObj.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export default getMediaService;