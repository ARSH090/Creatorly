const mongoose = require('mongoose');

const uri = "mongodb+srv://arshh12145_db_user:B8S9q7E526BnPZ5q@cluster0.x3qb1ru.mongodb.net/?appName=Cluster0";

console.log('Testing MongoDB connection...');
console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

const start = Date.now();

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        const duration = Date.now() - start;
        console.log(`✅ Connected successfully in ${duration}ms`);
        return mongoose.connection.db.admin().ping();
    })
    .then(() => {
        console.log('✅ Ping successful');
        return mongoose.disconnect();
    })
    .catch(err => {
        const duration = Date.now() - start;
        console.error(`❌ Connection failed after ${duration}ms`);
        console.error(err);
    });
