import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DBNAME || undefined,
    });

    console.log('[mongo] connected');
  } catch (err) {
    console.error('[mongo] connection error', err);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
