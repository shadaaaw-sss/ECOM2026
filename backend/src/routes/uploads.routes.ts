import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getMediaService, UploadOptions } from '../services/media.service.js';

const upload = multer({ storage: multer.memoryStorage() });
export const uploadsRoutes = Router();

// POST /api/uploads - Upload a single file (requires admin auth)
uploadsRoutes.post('/', authMiddleware, requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const mediaService = getMediaService();

    // Determine folder from query or default
    const folder = (req.query.folder as string) || 'uploads';
    const isVideo = req.file.mimetype.startsWith('video/');

    const options: UploadOptions = {
      folder,
      maxWidth: Number(req.query.maxWidth) || 1200,
      maxHeight: Number(req.query.maxHeight) || 1200,
      quality: Number(req.query.quality) || 85,
      format: (req.query.format as 'jpeg' | 'png' | 'webp') || 'jpeg',
      skipProcessing: isVideo,
      contentType: isVideo ? req.file.mimetype : undefined,
    };

    const result = await mediaService.upload(req.file.buffer, options);

    res.json({
      url: result.url,
      key: result.key,
      provider: result.provider,
      width: result.width,
      height: result.height,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload file' });
  }
});

// DELETE /api/uploads/:key - Delete a file (requires admin auth)
uploadsRoutes.delete('/:key', authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const mediaService = getMediaService();
    const key = req.params.key;

    if (!key) {
      return res.status(400).json({ message: 'Key is required' });
    }

    await mediaService.delete(key);
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete file' });
  }
});

// GET /api/uploads/signed-url/:key - Get a signed URL for private access (requires auth)
uploadsRoutes.get('/signed-url/:key', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const mediaService = getMediaService();
    const key = req.params.key;
    const expiresIn = Number(req.query.expiresIn) || 3600;

    const url = await mediaService.getSignedUrl(key, expiresIn);
    res.json({ url, expiresIn });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate signed URL' });
  }
});

// GET /api/uploads/public-url/:key - Get public URL for a key (no auth needed for public files)
uploadsRoutes.get('/public-url/:key', async (req, res) => {
  try {
    const mediaService = getMediaService();
    const key = req.params.key;
    const url = mediaService.getPublicUrl(key);
    res.json({ url });
  } catch (error: any) {
    console.error('Public URL error:', error);
    res.status(500).json({ message: error.message || 'Failed to get public URL' });
  }
});

// POST /api/uploads/multiple - Upload multiple files (requires admin auth)
uploadsRoutes.post('/multiple', authMiddleware, requireAdmin, upload.array('files', 10), async (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const mediaService = getMediaService();
    const folder = (req.query.folder as string) || 'uploads';

    const baseOptions = {
      folder,
      maxWidth: Number(req.query.maxWidth) || 1200,
      maxHeight: Number(req.query.maxHeight) || 1200,
      quality: Number(req.query.quality) || 85,
      format: (req.query.format as 'jpeg' | 'png' | 'webp') || 'jpeg',
    };

    const results = await Promise.all(
      files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        const options: UploadOptions = {
          ...baseOptions,
          skipProcessing: isVideo,
          contentType: isVideo ? file.mimetype : undefined,
        };
        return mediaService.upload(file.buffer, options);
      })
    );

    res.json({
      files: results.map(r => ({
        url: r.url,
        key: r.key,
        provider: r.provider,
        width: r.width,
        height: r.height,
        size: r.size,
        contentType: r.contentType,
      })),
    });
  } catch (error: any) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload files' });
  }
});

export default uploadsRoutes;