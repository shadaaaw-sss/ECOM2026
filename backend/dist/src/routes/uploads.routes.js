import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
const upload = multer({ storage: multer.memoryStorage() });
export const uploadsRoutes = Router();
const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});
async function uploadToR2(file, folder) {
    const resized = await sharp(file.buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    const key = `${folder}/${randomUUID()}-${Date.now()}.jpg`;
    await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: resized,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
    }));
    return `${process.env.R2_PUBLIC_URL}/${key}`;
}
uploadsRoutes.post('/', upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });
    const url = await uploadToR2(req.file, 'uploads');
    res.json({ url });
});
uploadsRoutes.delete('/:key', async (req, res) => {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: req.params.key }));
    res.json({ ok: true });
});
