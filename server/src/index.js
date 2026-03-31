const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectMongo } = require('./config/mongodb');

const authRoutes = require('./routes/auth');
const lostItemRoutes = require('./routes/lostItems');
const foundItemRoutes = require('./routes/foundItems');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
let dbInitPromise = null;

async function ensureDatabaseReady() {
  if (!dbInitPromise) {
    dbInitPromise = connectMongo().catch((error) => {
      dbInitPromise = null;
      throw error;
    });
  }

  return dbInitPromise;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (isVercel) {
  app.use(async (req, res, next) => {
    try {
      await ensureDatabaseReady();
      next();
    } catch (error) {
      console.error('MongoDB initialization error:', error);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/found-items', foundItemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await ensureDatabaseReady();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (!isVercel) {
  startServer();
}

module.exports = app;
