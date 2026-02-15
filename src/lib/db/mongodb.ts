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

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts: any = {
            ...mongoSecurityOptions,
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000, // 5 seconds to fail fast if no connection
            socketTimeoutMS: 45000, // 45 seconds to close idle sockets
            family: 4, // Use IPv4, skip IPv6

        };

        console.log('📡 Attempting MongoDB connection...');
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('✅ MongoDB connected successfully');
            return mongoose;
        }).catch(err => {
            console.error('❌ MongoDB connection error:', err);
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}
