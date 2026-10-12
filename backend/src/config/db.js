import mongoose from 'mongoose';

let mongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_chat_assistant';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick check
    });
    mongoConnected = true;
    console.log(`✅ [MongoDB] Successfully connected to database: ${mongoose.connection.name}`);
  } catch (error) {
    mongoConnected = false;
    console.warn(`⚠️  [MongoDB] Not detected or connection failed (${error.message}).`);
    console.warn(`⚡ [Storage] Gracefully activating local JSON/In-Memory fallback persistence engine.`);
  }
};

export const isMongoConnected = () => mongoConnected;
