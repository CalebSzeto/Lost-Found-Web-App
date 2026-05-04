const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');
const { v4: uuidv4 } = require('uuid');

function getExtension(file) {
  const extFromName = path.extname(file.originalname || '').toLowerCase();
  if (extFromName) {
    return extFromName;
  }

  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  if (file.mimetype === 'image/heic') return '.heic';
  if (file.mimetype === 'image/heif') return '.heif';
  if (file.mimetype === 'image/gif') return '.gif';
  return '.jpg';
}

async function uploadImage(file, folder) {
  const imageId = uuidv4();
  const ext = getExtension(file);
  const fileName = `${folder}/${imageId}${ext}`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    const blob = await put(fileName, file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.mimetype,
      token: blobToken,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required on Vercel for image uploads');
  }

  const uploadDir = path.join(__dirname, '../../uploads', folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const localFilePath = path.join(uploadDir, `${imageId}${ext}`);
  await fs.writeFile(localFilePath, file.buffer);

  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${folder}/${imageId}${ext}`;
}

module.exports = { uploadImage };