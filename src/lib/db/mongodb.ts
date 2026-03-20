import mongoose from 'mongoose';
import { mongoSecurityOptions } from '@/lib/security/database-security';

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            ...mongoSecurityOptions,
            bufferCommands: false,
            maxPoolSize: 10,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            console.log('✅ MongoDB connected successfully (singleton)');
            return mongoose;
        });
    }

    try {
        // SCALABILITY: Check active connections before proceeding
        const connectionCount = mongoose.connection.readyState;
        if (connectionCount === 1) return cached.conn;

        cached.conn = await cached.promise;
        
        // Log connection pool info
        const poolSize = (mongoose.connection as any).client?.topology?.s?.options?.maxPoolSize || 'unknown';
        console.log(`[MongoDB] Using connection pool (size: ${poolSize})`);
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}
