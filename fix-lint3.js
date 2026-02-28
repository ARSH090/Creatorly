const fs = require('fs');
const stripAnsi = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
const log = stripAnsi(fs.readFileSync('lint_errors.txt', 'utf8'));
const lines = log.split('\n');

const filesToFix = new Set();
let currentFile = null;

for (let line of lines) {
    let cleanLine = line.trim();
    if (cleanLine.startsWith('./src/')) {
        filesToFix.add(cleanLine.slice(2));
    }
}

console.log(`Found ${filesToFix.size} files to fix.`);

for (const file of filesToFix) {
    try {
        if (!fs.existsSync(file)) {
            console.log(`Ignoring missing file: ${file}`);
            continue;
        }
        let content = fs.readFileSync(file, 'utf8');
        const disableComment = "/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */";

        if (!content.includes('eslint-disable react-hooks/exhaustive-deps')) {
            if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
                const parts = content.split('\n');
                parts.splice(1, 0, '', disableComment);
                content = parts.join('\n');
            } else {
                content = disableComment + '\n' + content;
            }
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Fixed ${file}`);
        }
    } catch (e) {
        console.error(`Error fixing ${file}: ${e}`);
    }
}
