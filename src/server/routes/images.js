import { Router } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../lib/errors.js';
import { getCollectionModel } from '../services/db.js';
import { createImageUploadUrl, getImageBuffer } from '../services/storage.js';

export function createPublicImageRouter() {
  const router = Router();

  router.get('/images/:id', async (req, res, next) => {
    try {
      const ImageModel = getCollectionModel('images');
      const doc = await ImageModel.findById(req.params.id).lean();
      if (!doc) {
        throw new AppError('Image not found', 404, 'IMAGE_NOT_FOUND');
      }

      if (doc.imageData) {
        res.set('Content-Type', doc.mimeType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(Buffer.from(doc.imageData, 'base64'));
      }

      if (doc.storageKey) {
        try {
          const { buffer, contentType } = await getImageBuffer(doc.storageKey);
          res.set('Content-Type', contentType || doc.mimeType || 'image/jpeg');
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(buffer);
        } catch {
          // fall through to URL redirect
        }
      }

      if (doc.url && doc.url.startsWith('http')) {
        return res.redirect(doc.url);
      }

      throw new AppError('Image asset missing', 404, 'IMAGE_ASSET_MISSING');
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createImageUploadRouter() {
  const router = Router();

  router.post('/upload-image/prepare', async (req, res, next) => {
    try {
      const mimeType = req.body?.mimeType || 'application/octet-stream';
      const originalName = req.body?.originalName || 'image.jpg';
      const result = await createImageUploadUrl({ mimeType, originalName });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.post('/upload-image/complete', async (req, res, next) => {
    try {
      const title = req.body?.title || '';
      const tags = req.body?.tags || '';
      const time = req.body?.time || new Date().toISOString();
      const storageKey = req.body?.storageKey || '';
      const url = req.body?.url || null;
      const mimeType = req.body?.mimeType || 'image/jpeg';

      if (!storageKey || !tags) {
        throw new AppError('Missing storage key or tags', 400, 'INVALID_IMAGE_UPLOAD');
      }

      const ImageModel = getCollectionModel('images');
      const id = new mongoose.Types.ObjectId().toString();

      await ImageModel.create({
        _id: id,
        title,
        tags,
        url,
        storageKey,
        mimeType,
        time,
      });

      res.json({ success: true, id, url, storageKey });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
