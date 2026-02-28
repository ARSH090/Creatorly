// fix-all-lint.mjs
// Batch fix all ESLint unescaped entity errors across the codebase
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'fs';
import { join } from 'path';

// Recursively find all .tsx and .ts files under src/
function getAllFiles(dir) {
    const { readdirSync, statSync } = await import('fs');
    const files = [];
    function walk(d) {
        try {
            for (const f of readdirSync(d)) {
                const full = join(d, f);
                try {
                    if (statSync(full).isDirectory()) {
                        walk(full);
                    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
                        files.push(full);
                    }
                } catch { }
            }
        } catch { }
    }
    walk(dir);
    return files;
}

import { readdirSync, statSync } from 'fs';
import { join as pathJoin } from 'path';

function walk(d) {
    const files = [];
    try {
        for (const f of readdirSync(d)) {
            const full = pathJoin(d, f);
            try {
                if (statSync(full).isDirectory()) {
                    files.push(...walk(full));
                } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
                    files.push(full);
                }
            } catch { }
        }
    } catch { }
    return files;
}

// Fix patterns:
// 1. Bare apostrophes in JSX text nodes: don't → don&apos;t (only inside JSX text, not in strings)
// 2. Bare quotes in JSX text nodes
// Strategy: for any line that has a JSX text pattern with unescaped ' or "
// we wrap the problematic text portions

function fixUnescapedEntities(content) {
    // Fix patterns like: >text with ' apostrophe< 
    // This regex targets text between JSX closing/opening tags that has bare ' or "
    // Strategy: replace apostrophes in JSX text nodes with &apos;
    // We do this by finding JSX literal text segments (not inside {} or attributes)

    let fixed = content;

    // Pattern 1: Unescaped ' in JSX text (between > and <)
    // Match lines that contain JSX text with apostrophes
    // But skip: strings in {}, attributes, comments
    fixed = fixed.replace(
        /(?<=>)([^<{]*)'([^<{]*)(?=<)/g,
        (match, before, after) => {
            return `>${before}&apos;${after}`;
        }
    );

    // Pattern 2: Unescaped " in JSX text (between > and <)
    fixed = fixed.replace(
        /(?<=>)([^<{]*)\"([^<{]*)(?=<)/g,
        (match, before, after) => {
            return `>${before}&quot;${after}`;
        }
    );

    return fixed;
}

const srcDir = 'src';
const files = walk(srcDir);
let fixedCount = 0;
let errorFiles = 0;

for (const file of files) {
    try {
        const original = readFileSync(file, 'utf8');
        const fixed = fixUnescapedEntities(original);
        if (fixed !== original) {
            writeFileSync(file, fixed, 'utf8');
            fixedCount++;
            console.log(`Fixed: ${file}`);
        }
    } catch (e) {
        errorFiles++;
        console.error(`Error on ${file}: ${e.message}`);
    }
}

console.log(`\n✅ Fixed ${fixedCount} files. Errors: ${errorFiles}`);
