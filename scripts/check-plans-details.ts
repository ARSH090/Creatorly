import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkPrices() {
    const { connectToDatabase } = await import('../src/lib/db/mongodb');
    const { default: Plan } = await import('../src/lib/models/Plan');

    await connectToDatabase();
    const plans = await Plan.find({});
    console.log('Current Plans details:');
    plans.forEach(p => {
        console.log(`- ${p.name} (${p.tier}):`);
        console.log(`  Monthly Price: ${p.monthlyPrice}`);
        console.log(`  Yearly Price: ${p.yearlyPrice}`);
        console.log(`  razorpayPlanHistory: ${JSON.stringify(p.razorpayPlanHistory)}`);
    });
    process.exit(0);
}

checkPrices();
