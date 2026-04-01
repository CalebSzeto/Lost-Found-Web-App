const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const FoundItem = require('../models/FoundItem');
const Message = require('../models/Message');
const { authenticate, requireActiveUser } = require('../middleware/auth');
const { uploadImage } = require('../lib/imageUpload');

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const EXPIRATION_DAYS = parseInt(process.env.POST_EXPIRATION_DAYS) || 30;

function handleImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image must be 4MB or smaller' });
    }

    return res.status(400).json({ error: err.message || 'Invalid image upload' });
  });
}

function maybeHandleImageUpload(req, res, next) {
  if (req.is('multipart/form-data')) {
    return handleImageUpload(req, res, next);
  }
  return next();
}

function isExpired(createdAt) {
  const created = new Date(createdAt);
  const expirationDate = new Date(created.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
}

function toTimestamp(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function compareDates(aValue, bValue, direction = 'desc') {
  const aTime = toTimestamp(aValue);
  const bTime = toTimestamp(bValue);

  // Put invalid/missing dates at the end of the list.
  if (aTime === null && bTime === null) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;

  return direction === 'asc' ? aTime - bTime : bTime - aTime;
}

// POST /api/found-items - Create a found item post
router.post('/', authenticate, requireActiveUser, handleImageUpload, async (req, res) => {
  try {
    const { title, description, location, date_found, dropoff_time } = req.body;

    if (!description || !location) {
      return res.status(400).json({ error: 'Description and location are required' });
    }

    let image_url = null;
    if (req.file) {
      image_url = await uploadImage(req.file, 'found-items');
    }

    const normalizedDateFound = date_found || new Date().toISOString().split('T')[0];

    const found_item_id = uuidv4();
    const normalizedTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Found item';

    const foundItem = {
      found_item_id,
      user_id: req.user.uid,
      user_email: req.user.email,
      title: normalizedTitle,
      description,
      location,
      date_found: normalizedDateFound,
      image_url,
      dropoff_time: dropoff_time || null,
      status: 'active',
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    await FoundItem.create(foundItem);
    res.status(201).json({ message: 'Found item post created', item: foundItem });
  } catch (error) {
    console.error('Create found item error:', error);
    res.status(500).json({ error: `Failed to create found item post: ${error.message}` });
  }
});

// GET /api/found-items - Get all active found items
router.get('/', async (req, res) => {
  try {
    const { keyword, location, sortBy = 'most_recent' } = req.query;

    const activeItems = await FoundItem.find({ status: 'active' }).sort({ is_pinned: -1, created_at: -1 }).lean();
    const expiredIds = [];
    let items = [];

    activeItems.forEach((item) => {
      if (!isExpired(item.created_at)) {
        items.push(item);
      } else {
        expiredIds.push(item.found_item_id);
      }
    });

    if (expiredIds.length > 0) {
      await FoundItem.updateMany({ found_item_id: { $in: expiredIds } }, { $set: { status: 'expired' } });
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.description.toLowerCase().includes(kw) ||
          (item.title && item.title.toLowerCase().includes(kw))
      );
    }
    if (location) {
      const loc = location.toLowerCase();
      items = items.filter((item) => item.location.toLowerCase().includes(loc));
    }

    // Apply sorting (default: most recent post first)
    items.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }

      switch (sortBy) {
        case 'oldest_posted':
          return compareDates(a.created_at, b.created_at, 'asc');
        case 'date_recent':
          return compareDates(a.date_found, b.date_found, 'desc');
        case 'date_oldest':
          return compareDates(a.date_found, b.date_found, 'asc');
        case 'most_recent':
        default:
          return compareDates(a.created_at, b.created_at, 'desc');
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({ error: 'Failed to get found items' });
  }
});

// GET /api/found-items/:id - Get a single found item
router.get('/:id', async (req, res) => {
  try {
    const item = await FoundItem.findOne({ found_item_id: req.params.id }).lean();
    if (!item) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get found item error:', error);
    res.status(500).json({ error: 'Failed to get found item' });
  }
});

// PUT /api/found-items/:id - Update found item
router.put('/:id', authenticate, requireActiveUser, maybeHandleImageUpload, async (req, res) => {
  try {
    const item = await FoundItem.findOne({ found_item_id: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    if (item.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { status, title, description, location, date_found, dropoff_time, remove_image } = req.body;

    if (typeof title === 'string') item.title = title.trim() || 'Found item';
    if (typeof description === 'string') item.description = description.trim();
    if (typeof location === 'string') item.location = location.trim();
    if (typeof date_found === 'string') item.date_found = date_found;
    if (typeof dropoff_time === 'string') {
      item.dropoff_time = dropoff_time.trim() || null;
    }
    if (typeof status === 'string') item.status = status;

    if (remove_image === 'true') {
      item.image_url = null;
    }

    if (req.file) {
      item.image_url = await uploadImage(req.file, 'found-items');
    }

    if (!item.description || !item.location || !item.date_found) {
      return res.status(400).json({ error: 'Description, location, and date_found are required' });
    }
    await item.save();

    if (status === 'resolved') {
      await Message.deleteMany({ related_post_id: item.found_item_id });
    }

    res.json({ message: 'Found item updated', item });
  } catch (error) {
    console.error('Update found item error:', error);
    res.status(500).json({ error: 'Failed to update found item' });
  }
});

// DELETE /api/found-items/:id - Delete a found item post
router.delete('/:id', authenticate, requireActiveUser, async (req, res) => {
  try {
    const item = await FoundItem.findOne({ found_item_id: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    if (item.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Message.deleteMany({ related_post_id: item.found_item_id });
    await FoundItem.deleteOne({ found_item_id: req.params.id });
    res.json({ message: 'Found item deleted successfully' });
  } catch (error) {
    console.error('Delete found item error:', error);
    res.status(500).json({ error: 'Failed to delete found item' });
  }
});

module.exports = router;
