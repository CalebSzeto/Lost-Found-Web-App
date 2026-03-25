const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const LostItem = require('../models/LostItem');
const Message = require('../models/Message');
const authenticate = require('../middleware/auth');
const { uploadImage } = require('../lib/imageUpload');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
      return res.status(400).json({ error: 'Image must be 10MB or smaller' });
    }

    return res.status(400).json({ error: err.message || 'Invalid image upload' });
  });
}

/**
 * Check if a post is expired
 */
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

// POST /api/lost-items - Create a lost item post
router.post('/', authenticate, handleImageUpload, async (req, res) => {
  try {
    const { title, description, location, date_lost } = req.body;

    // Validation
    if (!title || !description || !location || !date_lost) {
      return res.status(400).json({ error: 'Title, description, location, and date_lost are required' });
    }

    let image_url = null;
    if (req.file) {
      image_url = await uploadImage(req.file, 'lost-items');
    }

    const lost_item_id = uuidv4();
    const lostItem = {
      lost_item_id,
      user_id: req.user.uid,
      user_email: req.user.email,
      title,
      description,
      location,
      date_lost,
      image_url,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await LostItem.create(lostItem);
    res.status(201).json({ message: 'Lost item post created', item: lostItem });
  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ error: `Failed to create lost item post: ${error.message}` });
  }
});

// GET /api/lost-items - Get all active lost items
router.get('/', async (req, res) => {
  try {
    const { keyword, location, date, sortBy = 'most_recent' } = req.query;

    const activeItems = await LostItem.find({ status: 'active' }).sort({ created_at: -1 }).lean();
    const expiredIds = [];
    let items = [];

    activeItems.forEach((item) => {
      if (!isExpired(item.created_at)) {
        items.push(item);
      } else {
        expiredIds.push(item.lost_item_id);
      }
    });

    if (expiredIds.length > 0) {
      await LostItem.updateMany({ lost_item_id: { $in: expiredIds } }, { $set: { status: 'expired' } });
    }

    // Apply filters
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(kw) ||
          item.description.toLowerCase().includes(kw)
      );
    }
    if (location) {
      const loc = location.toLowerCase();
      items = items.filter((item) => item.location.toLowerCase().includes(loc));
    }
    if (date) {
      items = items.filter((item) => {
        // Keep items lost on or after the selected date.
        if (!item.date_lost) return false;
        return item.date_lost >= date;
      });
    }

    // Apply sorting (default: most recent post first)
    items.sort((a, b) => {
      switch (sortBy) {
        case 'oldest_posted':
          return compareDates(a.created_at, b.created_at, 'asc');
        case 'date_recent':
          return compareDates(a.date_lost, b.date_lost, 'desc');
        case 'date_oldest':
          return compareDates(a.date_lost, b.date_lost, 'asc');
        case 'most_recent':
        default:
          return compareDates(a.created_at, b.created_at, 'desc');
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({ error: 'Failed to get lost items' });
  }
});

// GET /api/lost-items/:id - Get a single lost item
router.get('/:id', async (req, res) => {
  try {
    const item = await LostItem.findOne({ lost_item_id: req.params.id }).lean();
    if (!item) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get lost item error:', error);
    res.status(500).json({ error: 'Failed to get lost item' });
  }
});

// PUT /api/lost-items/:id - Update lost item status
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await LostItem.findOne({ lost_item_id: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    if (item.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { status } = req.body;
    item.status = status;
    await item.save();

    if (status === 'resolved') {
      await Message.deleteMany({ related_post_id: item.lost_item_id });
    }

    res.json({ message: 'Lost item updated' });
  } catch (error) {
    console.error('Update lost item error:', error);
    res.status(500).json({ error: 'Failed to update lost item' });
  }
});

// DELETE /api/lost-items/:id - Delete a lost item post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await LostItem.findOne({ lost_item_id: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    if (item.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await LostItem.deleteOne({ lost_item_id: req.params.id });
    res.json({ message: 'Lost item deleted successfully' });
  } catch (error) {
    console.error('Delete lost item error:', error);
    res.status(500).json({ error: 'Failed to delete lost item' });
  }
});

module.exports = router;
