import { Router, type Router as ExpressRouter, type Request } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';

export const uploadsRouter: ExpressRouter = Router();

// Extend AuthRequest to include file property from multer
interface AuthRequestWithFile extends AuthRequest {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload avatar
uploadsRouter.post('/avatar', authenticate, upload.single('avatar'), async (req: AuthRequestWithFile, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    res.json({ url: avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload server icon
uploadsRouter.post('/server-icon', authenticate, upload.single('icon'), async (req: AuthRequestWithFile, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const iconUrl = `/uploads/${req.file.filename}`;
    res.json({ url: iconUrl });
  } catch (error) {
    console.error('Error uploading server icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload message attachment
uploadsRouter.post('/attachment', authenticate, upload.single('file'), async (req: AuthRequestWithFile, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachmentUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      url: attachmentUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
