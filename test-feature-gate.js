
const http = require('http');

async function testGate(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'x-test-secret': 'f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1',
                'x-test-email': 'free@creatorly.test'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`PATH: ${path} | STATUS: ${res.statusCode}`);
                try {
                    const json = JSON.parse(body);
                    console.log(`BODY:`, JSON.stringify(json, null, 2));
                } catch (e) {
                    console.log(`BODY:`, body.slice(0, 100));
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request ${path}:`, e.message);
            resolve();
        });

        req.end();
    });
}

async function testPostGate(path, data) {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
                'x-test-secret': 'f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1',
                'x-test-email': 'free@creatorly.test'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`POST ${path} | STATUS: ${res.statusCode}`);
                try {
                    const json = JSON.parse(body);
                    console.log(`BODY:`, JSON.stringify(json, null, 2));
                } catch (e) {
                    console.log(`BODY:`, body.slice(0, 100));
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with POST ${path}:`, e.message);
            resolve();
        });

        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Gating Tests ---');
    await testGate('/api/v1/automation');
    await testGate('/api/v1/automations'); // Corrected path suspect

    console.log('--- POST Gating Tests (Should be 403) ---');
    await testPostGate('/api/v1/automations', {
        name: 'Hack Free Automation',
        triggerType: 'comment',
        steps: []
    });
}

runTests();
