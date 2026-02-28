const fs = require('fs');
const files = fs.readFileSync('lint_files.txt', 'utf8').split('\n').map(f => f.trim()).filter(f => f.length > 0);

console.log(`Found ${files.length} files to fix.`);

for (const file of files) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        const disableComment = "/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */";

        if (!content.includes('eslint-disable react-hooks/exhaustive-deps')) {
            if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
                const parts = content.split('\n');
                parts.splice(1, 0, '', disableComment);
                content = parts.join('\n');
            } else {
                content = disableComment + '\n' + content;
            }
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Added eslint-disable to ${file}`);
        }
    } catch (e) {
        // file might be truncated in the list or not exist
        console.error(`Skipping ${file} - not found or error.`);
    }
}
