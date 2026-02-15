config:
target: 'http://localhost:3000'
phases:
- duration: 60
arrivalRate: 5
rampTo: 20
name: Warm up phase
    - duration: 120
arrivalRate: 20
name: Sustained load
plugins:
metrics - by - endpoint: { }

scenarios:
- name: "Visitor Browsing & Checkout"
flow:
- get:
url: "/"
    - think: 2
        - get:
url: "/api/health"
    - think: 1
        - get:
url: "/api/products"
    - think: 5
        - post:
url: "/api/orders/create"
json:
productId: "64f1a2b3c4d5e6f7a8b9c0d1" # Mock or real product ID
customerEmail: "loadtest@example.com"
customerName: "Load User"
