const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db, bucket } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const EXPIRATION_DAYS = parseInt(process.env.POST_EXPIRATION_DAYS) || 30;

/**
 * Upload image to Firebase Storage
 */
async function uploadImage(file) {
  const fileName = `lost-items/${uuidv4()}-${file.originalname}`;
  const fileRef = bucket.file(fileName);

  await fileRef.save(file.buffer, {
    metadata: { contentType: file.mimetype },
  });

  await fileRef.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

/**
 * Check if a post is expired
 */
function isExpired(createdAt) {
  const created = new Date(createdAt);
  const expirationDate = new Date(created.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
}

// POST /api/lost-items - Create a lost item post
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { title, description, location, date_lost } = req.body;

    // Validation
    if (!title || !description || !location || !date_lost) {
      return res.status(400).json({ error: 'Title, description, location, and date_lost are required' });
    }

    let image_url = null;
    if (req.file) {
      image_url = await uploadImage(req.file);
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

    await db.collection('lost_items').doc(lost_item_id).set(lostItem);
    res.status(201).json({ message: 'Lost item post created', item: lostItem });
  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ error: 'Failed to create lost item post' });
  }
});

// GET /api/lost-items - Get all active lost items
router.get('/', async (req, res) => {
  try {
    const { keyword, location, date, status } = req.query;

    let query = db.collection('lost_items').orderBy('created_at', 'desc');

    const snapshot = await query.get();
    let items = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out expired items unless explicitly requesting them
      if (data.status === 'active' && !isExpired(data.created_at)) {
        items.push(data);
      } else if (data.status === 'active' && isExpired(data.created_at)) {
        // Auto-expire
        db.collection('lost_items').doc(doc.id).update({ status: 'expired' });
      }
    });

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
      items = items.filter((item) => item.date_lost === date);
    }

    res.json(items);
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({ error: 'Failed to get lost items' });
  }
});

// GET /api/lost-items/:id - Get a single lost item
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('lost_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Get lost item error:', error);
    res.status(500).json({ error: 'Failed to get lost item' });
  }
});

// PUT /api/lost-items/:id - Update lost item status
router.put('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('lost_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    if (doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { status } = req.body;
    await db.collection('lost_items').doc(req.params.id).update({ status });
    res.json({ message: 'Lost item updated' });
  } catch (error) {
    console.error('Update lost item error:', error);
    res.status(500).json({ error: 'Failed to update lost item' });
  }
});

// DELETE /api/lost-items/:id - Delete a lost item post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('lost_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    if (doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.collection('lost_items').doc(req.params.id).delete();
    res.json({ message: 'Lost item deleted successfully' });
  } catch (error) {
    console.error('Delete lost item error:', error);
    res.status(500).json({ error: 'Failed to delete lost item' });
  }
});

module.exports = router;
