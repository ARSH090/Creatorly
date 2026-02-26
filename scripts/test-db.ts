import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config({ path: '.env.local' });

async function testConnection() {
    console.log('Starting connection test...');
    const uri = process.env.MONGODB_URI;
    console.log('URI found:', uri ? 'Yes (hidden for security)' : 'No');

    if (!uri) {
        console.error('MONGODB_URI is missing!');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
