const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_SECRET = 'f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1';

async function verify() {
    console.log('--- STARTING LOCAL API VERIFICATION ---');
    const headers = {
        'x-test-secret': TEST_SECRET,
        'Content-Type': 'application/json'
    };

    try {
        // TC001: Get Profile
        console.log('\nTC001: GET /api/creator/profile');
        const profileRes = await axios.get(`${BASE_URL}/api/creator/profile`, { headers });
        console.log('Status:', profileRes.status);
        console.log('Success:', profileRes.data.success);
        console.log('Has storefrontConfig:', !!profileRes.data.data.storefrontConfig);

        // TC002: Patch Profile
        console.log('\nTC002: PATCH /api/creator/profile');
        const patchRes = await axios.patch(`${BASE_URL}/api/creator/profile`, {
            theme: { primaryColor: '#ff0000' }
        }, { headers });
        console.log('Status:', patchRes.status);
        console.log('Success:', patchRes.data.success);
        console.log('Has updatedProfile:', !!patchRes.data.data.updatedProfile);
        console.log('Updated theme check:', patchRes.data.data.updatedProfile.theme?.primaryColor === '#ff0000');

        // TC003: List Products
        console.log('\nTC003: GET /api/products');
        const productsRes = await axios.get(`${BASE_URL}/api/products`, { headers });
        console.log('Status:', productsRes.status);
        console.log('Success:', productsRes.data.success);
        console.log('Is Array:', Array.isArray(productsRes.data.data));

        // TC004: Create Product
        console.log('\nTC004: POST /api/products');
        const productData = {
            name: "Test Local Product " + Date.now(),
            description: "Verification product",
            price: 500,
            productType: "digital_download", // FIXED: using allowed enum value
            thumbnailKey: "test-thumb",
            fileKey: "test-file",
            isPublished: true
        };
        const createRes = await axios.post(`${BASE_URL}/api/products`, productData, { headers });
        console.log('Status:', createRes.status);
        console.log('Success:', createRes.data.success);
        console.log('Has data.slug:', !!createRes.data.data.slug);

        // TC005: Orders
        console.log('\nTC005: GET /api/orders');
        const ordersRes = await axios.get(`${BASE_URL}/api/orders`, { headers });
        console.log('Status:', ordersRes.status);
        console.log('Success:', ordersRes.data.success);

        // TC006: oEmbed
        console.log('\nTC006: GET /api/storefront/oembed');
        try {
            const oembedRes = await axios.get(`${BASE_URL}/api/storefront/oembed?platform=tiktok&url=https://www.tiktok.com/@creatorly/video/123`, { headers });
            console.log('Status:', oembedRes.status);
        } catch (e) {
            console.log('TC006 (Expected failure or success):', e.response?.status || e.message);
        }

        // TC007: Admin Announcements
        console.log('\nTC007: GET /api/admin/announcements');
        try {
            const adminRes = await axios.get(`${BASE_URL}/api/admin/announcements`, { headers });
            console.log('Status:', adminRes.status);
            console.log('Success:', adminRes.data.success);
            console.log('Is Array:', Array.isArray(adminRes.data.data));
        } catch (e) {
            console.log('TC007 (Admin forbidden if not admin user):', e.response?.status || e.message);
        }

    } catch (error) {
        console.error('Verification Error Deep:', error.response?.data || error.message);
        if (error.response?.data?.details) console.log('Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    console.log('\n--- VERIFICATION FINISHED ---');
}

verify();
