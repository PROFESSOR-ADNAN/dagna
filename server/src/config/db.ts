import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production',
    });
    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}
