import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/saas_analytics';

  mongoose.connection.on('connected', () => {
    console.log('[mongo] connected:', uri);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  await mongoose.connect(uri, {
    maxPoolSize: 20,
  });

  return mongoose.connection;
}

export default mongoose;
