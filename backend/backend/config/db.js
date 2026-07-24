const mongoose = require('mongoose');

// Disable query buffering so Mongoose fails fast when DB is offline
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI || '';

  const isValidUri = uri &&
    !uri.includes('your_mongodb_connection_string') &&
    (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));

  if (isValidUri) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.log(`⚠️  MongoDB unavailable (${error.message}). Falling back to in-memory store.`);
    }
  } else {
    console.log(`ℹ️  No valid MONGO_URI configured. Falling back to in-memory store.`);
  }

  // In-memory store is already loaded via global.memoryStore in server.js
  console.log(`🗄️  Running with in-memory data store — all data resets on server restart.`);
  console.log(`👉  To persist data, set MONGO_URI in backend/.env to a MongoDB Atlas connection string.`);
};

module.exports = connectDB;
