const fs = require('fs');
const path = require('path');

const files = [
    "e:\\insta\\src\\components\\storefront\\TestimonialsSection.tsx",
    "e:\\insta\\src\\components\\storefront\\CommunitySection.tsx",
    "e:\\insta\\src\\components\\products\\ProductForm.tsx",
    "e:\\insta\\src\\components\\product\\ProductInfo.tsx",
    "e:\\insta\\src\\components\\CreatorDashboard.tsx",
    "e:\\insta\\src\\components\\community\\PostCard.tsx",
    "e:\\insta\\src\\components\\checkout\\DigitalCheckoutModal.tsx",
    "e:\\insta\\src\\app\\[username]\\book\\page.tsx",
    "e:\\insta\\src\\app\\[username]\\book\\[slug]\\ServiceBookingClient.tsx",
    "e:\\insta\\src\\app\\u\\[username]\\success\\[orderId]\\page.tsx",
    "e:\\insta\\src\\app\\portal\\[token]\\page.tsx",
    "e:\\insta\\src\\app\\p\\view\\[token]\\page.tsx",
    "e:\\insta\\src\\app\\explore\\page.tsx",
    "e:\\insta\\src\\app\\cart\\page.tsx",
    "e:\\insta\\src\\app\\account\\subscriptions\\page.tsx",
    "e:\\insta\\src\\app\\(dashboard)\\dashboard\\storefront\\page.tsx",
    "e:\\insta\\src\\app\\(dashboard)\\dashboard\\messages\\page.tsx",
    "e:\\insta\\src\\app\\(dashboard)\\dashboard\\projects\\page.tsx",
    "e:\\insta\\src\\app\\(dashboard)\\dashboard\\autodm\\page.tsx"
];

for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // If we have an <img ... > we replace it
    // We use regex to carefully match <img ... /> or <img ...>
    // and replace `<img ` with `<Image width={800} height={800} `
    if (content.includes('<img ')) {
        content = content.replace(/<img\s/g, '<Image width={800} height={800} ');

        // Check if we need to add the import
        if (!content.includes('import Image from')) {
            // Find the last import statement or put it at the very top
            const importLine = "import Image from 'next/image';\n";
            const importMatch = content.match(/import .* from .*;?\n/g);

            if (importMatch) {
                const lastMatch = importMatch[importMatch.length - 1];
                content = content.replace(lastMatch, lastMatch + importLine);
            } else {
                content = importLine + content;
            }
        }
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content);
        console.log("Updated", f);
    }
}
