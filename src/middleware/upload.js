const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { badRequest } = require('../utils/errors');

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

function isSupportedFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = config.supportedMimeTypes.includes(file.mimetype);
  const extOk = config.supportedExtensions.includes(ext);
  // Accept if either MIME or extension looks like audio/video
  // (browsers sometimes send application/octet-stream)
  if (mimeOk || extOk) return true;
  if (
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('video/')
  ) {
    return extOk || ext.length > 0;
  }
  return false;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    // Safe stored name: UUID + sanitized extension only
    const safeExt = /^[.][a-z0-9]{1,10}$/i.test(ext) ? ext : '';
    cb(null, `${uuidv4()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!isSupportedFile(file)) {
      return cb(
        badRequest(
          'Unsupported file type. Upload an audio or video file.',
          {
            mimeType: file.mimetype,
            originalName: file.originalname,
            allowedExtensions: config.supportedExtensions,
          }
        )
      );
    }
    return cb(null, true);
  },
});

/** Middleware: expect a single field named "file" */
function uploadMedia(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) {
      return next(badRequest('No file provided. Send a multipart field named "file".'));
    }
    return next();
  });
}

module.exports = {
  uploadMedia,
};
