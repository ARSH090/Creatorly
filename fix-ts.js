const fs = require('fs');
const files = [
    'E:/insta/src/app/api/creator/autodm/logs/route.ts',
    'E:/insta/src/app/api/creator/autodm/pending/[id]/route.ts',
    'E:/insta/src/app/api/creator/autodm/pending/[id]/send/route.ts',
    'E:/insta/src/app/api/creator/autodm/pending/route.ts',
    'E:/insta/src/app/api/creator/autodm/rules/[id]/route.ts',
    'E:/insta/src/app/api/creator/autodm/rules/[id]/toggle/route.ts',
    'E:/insta/src/app/api/creator/autodm/stats/route.ts',
    'E:/insta/src/app/api/webhooks/instagram/route.ts'
];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) return;
        let c = fs.readFileSync(file, 'utf8');

        // Fix 1: user possibly null after User.findOne
        c = c.replace(/const user = await User\.findOne\(\{ clerkId: userId \}\)\.select\('_id'\);/g,
            "const user = await User.findOne({ clerkId: userId }).select('_id');\n        if (!user) return new NextResponse('User not found', { status: 404 });");

        c = c.replace(/const user = await User\.findOne\(\{ clerkId: userId \}\)\.select\('_id instagramConnection'\);/g,
            "const user = await User.findOne({ clerkId: userId }).select('_id instagramConnection');\n        if (!user) return new NextResponse('User not found', { status: 404 });");

        // Fix 2: Object possibly undefined before accessing accessToken
        c = c.replace(/creator\.instagramConnection\.accessToken/g, "creator.instagramConnection?.accessToken!");
        c = c.replace(/user\.instagramConnection\.accessToken/g, "user.instagramConnection?.accessToken!");

        fs.writeFileSync(file, c);
        console.log('Fixed:', file);
    } catch (e) {
        console.error('Error in', file, e);
    }
});
