const fs = require('fs');
const path = require('path');

function walk(dir, routes = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, routes);
        } else if (file === 'page.tsx' || file === 'route.ts') {
            routes.push(fullPath);
        }
    }
    return routes;
}

const allRoutes = walk('e:\\insta\\src\\app');

const idRoutes = [];
const planIdRoutes = [];

for (const p of allRoutes) {
    if (p.includes('[id]')) idRoutes.push(p);
    if (p.includes('[planId]')) planIdRoutes.push(p);
}

let report = "--- [planId] routes ---\n";
planIdRoutes.forEach(p => { report += p + "\n"; });
report += "\n--- [id] routes ---\n";
idRoutes.forEach(p => { report += p + "\n"; });

fs.writeFileSync('routes_dump.txt', report);
console.log('Saved to routes_dump.txt');
