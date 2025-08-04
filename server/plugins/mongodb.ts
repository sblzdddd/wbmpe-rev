// server/plugins/mongodb.ts
import mongoose from 'mongoose';
import type { Nitro } from 'nitropack';

const logger = BakaLogger.child({service: 'MongoDB'})

export default async (_nitroApp: Nitro) => {
  const config = useRuntimeConfig(); // Access runtime config

  try {
    await mongoose.connect(config.mongodbUri as string);
    logger.log('success', 'Connected to MongoDB', {service: 'MongoDB'});
    
    // Wait for the connection to be ready
    await mongoose.connection.asPromise();
    logger.log('success', 'MongoDB connection is ready', {service: 'MongoDB'});
  } catch (e) {
    logger.error('Error connecting to MongoDB:', e, {service: 'MongoDB'});
  }
};