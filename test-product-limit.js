
const http = require('http');

const data = JSON.stringify({
    title: 'Test Product 2',
    price: 10,
    description: 'A test description for the second product.',
    category: 'Digital'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-test-secret': 'f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1',
        'x-test-email': 'pro@creatorly.test'
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
