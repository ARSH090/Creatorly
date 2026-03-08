const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('e:\\insta\\src');

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    const ucRegex = /import [^\n]+;\n'use client';/g;

    // If 'use client' is not the first string but appears inside
    if (content.includes("'use client';")) {
        const lines = content.split('\n');
        let hasUseClient = false;
        let ucIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("'use client'")) {
                hasUseClient = true;
                ucIndex = i;
                break;
            }
        }

        // If 'use client' is not the first non-empty line
        if (hasUseClient && ucIndex > 0) {
            // remove it from where it is
            lines.splice(ucIndex, 1);
            // add to top
            lines.unshift("'use client';");
            fs.writeFileSync(f, lines.join('\n'));
            console.log("Fixed 'use client' in", f);
        }
    }
}
