const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { connectMongo } = require('../config/mongodb');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

const ROOT_UPLOADS_DIR = path.join(__dirname, '../../uploads');
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function getArgs() {
  const args = process.argv.slice(2);
  return {
    write: args.includes('--write'),
  };
}

function parseLegacyUploadPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  let pathname = imageUrl;

  try {
    const parsed = new URL(imageUrl);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!isLocalHost) {
      return null;
    }
    pathname = parsed.pathname;
  } catch {
    // Non-URL values like /uploads/... are handled below.
  }

  const match = pathname.match(/^\/uploads\/(lost-items|found-items)\/([^/?#]+)$/);
  if (!match) {
    return null;
  }

  return {
    folder: match[1],
    fileName: match[2],
    localPath: path.join(ROOT_UPLOADS_DIR, match[1], match[2]),
  };
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.jpeg' || ext === '.jpg') return 'image/jpeg';
  return 'application/octet-stream';
}

async function migrateCollection(model, itemIdField, write) {
  const docs = await model.find({ image_url: { $exists: true, $ne: null } });
  const summary = {
    scanned: docs.length,
    migrated: 0,
    skipped: 0,
    missingFile: 0,
    errors: 0,
  };

  for (const doc of docs) {
    const legacy = parseLegacyUploadPath(doc.image_url);
    if (!legacy) {
      summary.skipped += 1;
      continue;
    }

    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(legacy.localPath);
    } catch {
      summary.missingFile += 1;
      continue;
    }

    if (!write) {
      summary.migrated += 1;
      continue;
    }

    try {
      const blobPath = `backfill/${legacy.folder}/${legacy.fileName}`;
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: getContentType(legacy.fileName),
        token: BLOB_TOKEN,
      });

      doc.image_url = blob.url;
      await doc.save();
      summary.migrated += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `Failed migrating ${doc[itemIdField]} (${legacy.localPath}): ${error.message}`
      );
    }
  }

  return summary;
}

async function main() {
  const { write } = getArgs();

  if (write && !BLOB_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is required when running with --write');
    process.exit(1);
  }

  await connectMongo();

  const lostSummary = await migrateCollection(LostItem, 'lost_item_id', write);
  const foundSummary = await migrateCollection(FoundItem, 'found_item_id', write);

  console.log('Backfill mode:', write ? 'WRITE' : 'DRY-RUN');
  console.log('Lost items:', lostSummary);
  console.log('Found items:', foundSummary);
  console.log('Done.');

  process.exit(0);
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});