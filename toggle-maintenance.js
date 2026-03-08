
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function toggleMaintenance(enabled) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const result = await db.collection('platformsettings').updateOne(
            {},
            {
                $set: {
                    maintenanceMode: enabled,
                    maintenanceMessage: enabled ? 'Under maintenance' : '',
                    updateLastModifiedBy: 'admin_test',
                    updateLastModifiedAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log(`Maintenance mode set to: ${enabled}`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

const args = process.argv.slice(2);
toggleMaintenance(args[0] === 'on');
