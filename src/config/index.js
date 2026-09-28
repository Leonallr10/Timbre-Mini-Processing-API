require('dotenv').config();
const path = require('path');

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://timbre:timbre@localhost:5432/timbre',
  uploadDir: path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR || 'uploads'
  ),
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES) || 100 * 1024 * 1024,
  // Simulated processing delay range (ms)
  processingDelayMs: {
    min: 2000,
    max: 5000,
  },
  supportedOperations: ['transcription', 'noise_reduction'],
  supportedMimeTypes: [
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/x-flac',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ],
  supportedExtensions: [
    '.mp3',
    '.wav',
    '.ogg',
    '.webm',
    '.aac',
    '.flac',
    '.m4a',
    '.mp4',
    '.mpeg',
    '.mpg',
    '.mov',
    '.avi',
    '.mkv',
  ],
};

module.exports = config;
