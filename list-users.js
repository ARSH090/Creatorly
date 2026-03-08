
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Username: ${u.username || 'N/A'}, ID: ${u._id}`);
        });
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
listUsers();
