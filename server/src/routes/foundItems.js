const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

const EXPIRATION_DAYS = parseInt(process.env.POST_EXPIRATION_DAYS) || 30;

function isExpired(createdAt) {
  const created = new Date(createdAt);
  const expirationDate = new Date(created.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
}

// POST /api/found-items - Create a found item post
router.post('/', authenticate, async (req, res) => {
  try {
    const { description, location, dropoff_time } = req.body;

    if (!description || !location) {
      return res.status(400).json({ error: 'Description and location are required' });
    }

    const found_item_id = uuidv4();
    const foundItem = {
      found_item_id,
      user_id: req.user.uid,
      user_email: req.user.email,
      description,
      location,
      dropoff_time: dropoff_time || null,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await db.collection('found_items').doc(found_item_id).set(foundItem);
    res.status(201).json({ message: 'Found item post created', item: foundItem });
  } catch (error) {
    console.error('Create found item error:', error);
    res.status(500).json({ error: 'Failed to create found item post' });
  }
});

// GET /api/found-items - Get all active found items
router.get('/', async (req, res) => {
  try {
    const { keyword, location } = req.query;

    const snapshot = await db.collection('found_items').orderBy('created_at', 'desc').get();
    let items = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active' && !isExpired(data.created_at)) {
        items.push(data);
      } else if (data.status === 'active' && isExpired(data.created_at)) {
        db.collection('found_items').doc(doc.id).update({ status: 'expired' });
      }
    });

    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter((item) => item.description.toLowerCase().includes(kw));
    }
    if (location) {
      const loc = location.toLowerCase();
      items = items.filter((item) => item.location.toLowerCase().includes(loc));
    }

    res.json(items);
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({ error: 'Failed to get found items' });
  }
});

// GET /api/found-items/:id - Get a single found item
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('found_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Get found item error:', error);
    res.status(500).json({ error: 'Failed to get found item' });
  }
});

// PUT /api/found-items/:id - Update found item status
router.put('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('found_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    if (doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { status } = req.body;
    await db.collection('found_items').doc(req.params.id).update({ status });
    res.json({ message: 'Found item updated' });
  } catch (error) {
    console.error('Update found item error:', error);
    res.status(500).json({ error: 'Failed to update found item' });
  }
});

// DELETE /api/found-items/:id - Delete a found item post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('found_items').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Found item not found' });
    }
    if (doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.collection('found_items').doc(req.params.id).delete();
    res.json({ message: 'Found item deleted successfully' });
  } catch (error) {
    console.error('Delete found item error:', error);
    res.status(500).json({ error: 'Failed to delete found item' });
  }
});

module.exports = router;
