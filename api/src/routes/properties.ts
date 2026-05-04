import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { requireAuth, requireSellerAccess, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { propertyCreateSchema, propertyQuerySchema, propertyUpdateSchema } from '../schemas/propertySchemas.js';
import * as propertyService from '../services/propertyService.js';
import { config } from '../config.js';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'properties');
const maxImageSizeBytes = config.uploads.maxImageSizeMb * 1024 * 1024;
const maxVideoSizeBytes = config.uploads.maxVideoSizeMb * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

const parsePropertyId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw { status: 400, message: 'Invalid property id' };
  return id;
};

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const allowedVideoMimeTypes = new Set(['video/mp4', 'video/webm']);

const fileExtensionForMimeType = (mimeType: string) => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/avif':
      return '.avif';
    case 'video/mp4':
      return '.mp4';
    case 'video/webm':
      return '.webm';
    default:
      return '';
  }
};

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => {
      const extension = fileExtensionForMimeType(file.mimetype) || path.extname(file.originalname) || '.bin';
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: maxImageSizeBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(Object.assign(new Error('Only JPG, PNG, WEBP, and AVIF images are allowed.'), { status: 400 }));
      return;
    }
    callback(null, true);
  },
});

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => {
      const extension = fileExtensionForMimeType(file.mimetype) || path.extname(file.originalname) || '.bin';
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: maxVideoSizeBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoMimeTypes.has(file.mimetype)) {
      callback(Object.assign(new Error('Only MP4 and WEBM videos are allowed.'), { status: 400 }));
      return;
    }
    callback(null, true);
  },
});

router.get('/', validate(propertyQuerySchema), async (req, res, next) => {
  try {
    const result = await propertyService.list(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/upload-image', requireAuth, requireSellerAccess, (req, res, next) => {
  imageUpload.single('image')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next({ status: 400, message: `Image must be ${config.uploads.maxImageSizeMb} MB or smaller.` });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw { status: 400, message: 'Image file is required.' };
    }

    const publicPath = `/uploads/properties/${req.file.filename}`;
    const backendUrl = config.backendUrl.replace(/\/+$/, '');
    res.status(201).json({
      url: `${backendUrl}${publicPath}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      name: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/upload-video', requireAuth, requireSellerAccess, (req, res, next) => {
  videoUpload.single('video')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next({ status: 400, message: `Video must be ${config.uploads.maxVideoSizeMb} MB or smaller.` });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw { status: 400, message: 'Video file is required.' };
    }

    const publicPath = `/uploads/properties/${req.file.filename}`;
    const backendUrl = config.backendUrl.replace(/\/+$/, '');
    res.status(201).json({
      url: `${backendUrl}${publicPath}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      name: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await propertyService.get(parsePropertyId(req.params.id));
    if (!property) return res.status(404).json({ message: 'Not found' });
    res.json(property);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireSellerAccess, validate(propertyCreateSchema), async (req: AuthRequest, res, next) => {
  try {
    const property = await propertyService.create({ id: req.user!.id, role: req.user!.role }, req.body);
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireSellerAccess, validate(propertyUpdateSchema), async (req: AuthRequest, res, next) => {
  try {
    const updated = await propertyService.update(parsePropertyId(req.params.id), { id: req.user!.id, role: req.user!.role }, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireSellerAccess, async (req: AuthRequest, res, next) => {
  try {
    await propertyService.remove(parsePropertyId(req.params.id), { id: req.user!.id, role: req.user!.role });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
