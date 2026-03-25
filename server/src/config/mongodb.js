const mongoose = require('mongoose');

let connectPromise = null;

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lost_and_found';

  connectPromise = mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || undefined,
  });

  await connectPromise;
  connectPromise = null;

  console.log('Connected to MongoDB');
  return mongoose.connection;
}

module.exports = { connectMongo };
