// server/plugins/mongodb.ts
import mongoose from 'mongoose';
import type { Nitro } from 'nitropack';

export default async (_nitroApp: Nitro) => {
  const config = useRuntimeConfig(); // Access runtime config

  try {
    await import('~/server/models/index')
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    
    // Wait for the connection to be ready
    await mongoose.connection.asPromise();
    console.log('MongoDB connection is ready');
  } catch (e) {
    console.error('Error connecting to MongoDB:', e);
  }
};