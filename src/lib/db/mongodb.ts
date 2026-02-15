import mongoose from 'mongoose';
import { mongoSecurityOptions } from '@/lib/security/database-security';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    // Check for MONGODB_URI at connection time, not module load time
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        throw new Error('Please define MONGODB_URI in your environment variables');
    }

    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (cached.conn) {
                return cached.conn;
            }

            if (!cached.promise) {
                const opts: any = {
                    ...mongoSecurityOptions,
                    bufferCommands: false,
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    family: 4,
                };

                console.log(`📡 Attempting MongoDB connection (Attempt ${retries + 1}/${maxRetries})...`);
                cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
                    console.log('✅ MongoDB connected successfully');
                    return mongoose;
                });
            }

            cached.conn = await cached.promise;
            return cached.conn;
        } catch (e) {
            retries++;
            console.error(`❌ MongoDB connection attempt ${retries} failed:`, e);
            cached.promise = null;

            if (retries >= maxRetries) {
                throw e;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retries) * 1000;
            console.log(`Waiting ${delay}ms before next retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return cached.conn;
}
