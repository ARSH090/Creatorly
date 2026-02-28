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
const map = new Map();

for (const p of allRoutes) {
    // Determine logical path by removing the physical directory root and route groups (folders in parentheses)
    let logical = p.substring(p.indexOf('src\\app') + 8);
    // Convert backslashes to forward slashes
    logical = logical.replace(/\\/g, '/');
    // Remove route groups like (dashboard), (admin)
    logical = logical.split('/').filter(segment => !segment.startsWith('(') || !segment.endsWith(')')).join('/');
    // Remove file name
    logical = logical.replace(/\/(page\.tsx|route\.ts)$/, '');

    // Normalize dynamic params to see if they overlap
    // e.g., "products/[id]" -> "products/[param]"
    const generic = logical.replace(/\[([^\]]+)\]/g, '[param]');

    if (!map.has(generic)) {
        map.set(generic, []);
    }
    map.get(generic).push({ physical: p, logical });
}

let report = "--- ROUTE CONFLICT REPORT ---\n";
for (const [generic, actuals] of map.entries()) {
    const uniqueSlugs = new Set();
    actuals.forEach(a => {
        const matches = a.logical.match(/\[([^\]]+)\]/g);
        if (matches) {
            matches.forEach(m => uniqueSlugs.add(m));
        }
    });

    if (uniqueSlugs.has('[id]') && uniqueSlugs.has('[planId]')) {
        report += `CONFLICT FOUND for Route: /${generic}\n`;
        actuals.forEach(a => {
            report += `  - ${a.logical} (Physical: ${a.physical})\n`;
        });
    }
}

fs.writeFileSync('conflict_report.txt', report);
console.log('Report generated at conflict_report.txt');
