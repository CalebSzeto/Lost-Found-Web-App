const DEFAULT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 2200;
const MIN_QUALITY = 0.55;

const SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function getFileExtension(name) {
  const dot = name?.lastIndexOf('.') ?? -1;
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export function isSupportedImageFile(file) {
  if (!file) return false;
  const type = file?.type?.toLowerCase();
  if (type && SUPPORTED_TYPES.has(type)) return true;
  const ext = getFileExtension(file?.name || '');
  return ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function getOutputName(originalName, mimeType) {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  if (mimeType === 'image/webp') return `${base}.webp`;
  if (mimeType === 'image/jpeg') return `${base}.jpg`;
  return `${base}.png`;
}

export async function normalizeImageFile(file) {
  if (!isSupportedImageFile(file)) {
    throw new Error('Unsupported image type');
  }
  return file;
}

export async function prepareImageForUpload(file, maxBytes = DEFAULT_MAX_UPLOAD_BYTES) {
  if (!file) return file;

  const normalizedFile = await normalizeImageFile(file);
  if (normalizedFile.size <= maxBytes) {
    return normalizedFile;
  }
  const image = await loadImageFromFile(normalizedFile);
  const ratio = Math.min(1, DEFAULT_MAX_DIMENSION / Math.max(image.width, image.height));

  let width = Math.max(1, Math.round(image.width * ratio));
  let height = Math.max(1, Math.round(image.height * ratio));
  let bestBlob = null;
  let bestMimeType = 'image/webp';

  const mimeCandidates = ['image/webp', 'image/jpeg'];

  for (const mimeType of mimeCandidates) {
    let currentWidth = width;
    let currentHeight = height;

    for (let scaleStep = 0; scaleStep < 6; scaleStep += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, currentWidth, currentHeight);

      for (let quality = 0.9; quality >= MIN_QUALITY; quality -= 0.1) {
        const blob = await canvasToBlob(canvas, mimeType, quality);
        if (!blob) continue;

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
          bestMimeType = mimeType;
        }

        if (blob.size <= maxBytes) {
          return new File([blob], getOutputName(file.name, mimeType), { type: mimeType });
        }
      }

      currentWidth = Math.max(1, Math.floor(currentWidth * 0.85));
      currentHeight = Math.max(1, Math.floor(currentHeight * 0.85));
    }
  }

  if (!bestBlob) {
    throw new Error('Could not optimize image');
  }

  if (bestBlob.size > maxBytes) {
    throw new Error('Image is too large even after optimization');
  }

  return new File([bestBlob], getOutputName(normalizedFile.name, bestMimeType), { type: bestMimeType });
}
