import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkPlans() {
    const { connectToDatabase } = await import('../src/lib/db/mongodb');
    const { default: Plan } = await import('../src/lib/models/Plan');

    await connectToDatabase();
    const plans = await Plan.find({});
    console.log('Current Plans in DB:');
    plans.forEach(p => {
        console.log(`- ${p.name} (${p.tier}):`);
        console.log(`  Monthly ID: ${p.razorpayMonthlyPlanId || 'MISSING'}`);
        console.log(`  Yearly ID: ${p.razorpayYearlyPlanId || 'MISSING'}`);
        console.log(`  History Length: ${p.razorpayPlanHistory?.length || 0}`);
    });
    process.exit(0);
}

checkPlans();
