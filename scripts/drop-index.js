const mongoose = require('mongoose');

async function dropIndex() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        if (indexes.some(i => i.name === 'firebaseUid_1')) {
            await collection.dropIndex('firebaseUid_1');
            console.log('Successfully dropped firebaseUid_1 index');
        } else {
            console.log('firebaseUid_1 index not found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

dropIndex();
