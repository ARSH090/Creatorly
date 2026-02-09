
import fs from 'fs';
import path from 'path';

const REQUIRED_FILES = [
    'src/components/landing/HeroSection.tsx',
    'src/components/dashboard/DashboardLayout.tsx',
    'src/components/dashboard/DashboardOverview.tsx',
    'src/app/u/[username]/page.tsx',
    'src/components/storefront/ProductCard.tsx',
    'src/components/storefront/StoreHeader.tsx',
    'src/app/cart/page.tsx',
    'src/components/checkout/CouponModal.tsx',
    'src/app/admin/dashboard/page.tsx',
    'src/components/layout/ClientLayout.tsx',
    'src/components/navigation/MobileNavigation.tsx',
    'src/components/common/ErrorBoundary.tsx'
];

console.log('Verifying frontend implementation...');

let missing = 0;
REQUIRED_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ Found: ${file}`);
    } else {
        console.error(`❌ Missing: ${file}`);
        missing++;
    }
});

if (missing > 0) {
    console.error(`\nverification failed: ${missing} files missing.`);
    process.exit(1);
} else {
    console.log('\nAll core frontend components verified successfully.');
    process.exit(0);
}
