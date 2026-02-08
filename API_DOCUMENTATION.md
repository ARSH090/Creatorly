# Creatorly Public API Documentation

**API Base URL**: `https://api.creatorly.app/v1`  
**API Version**: 1.0.0  
**Status**: Production Ready

---

## Authentication

All protected endpoints require an API key in the header:

```
X-API-Key: your_api_key_here
```

### Generate API Key

Creators can generate API keys from their dashboard:
- Go to Settings → API Keys
- Click "Generate New Key"
- Store it securely (you won't see it again)

---

## Rate Limiting

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1000 requests/hour
- **Enterprise**: Custom limits

Rate limit info in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707417600
```

---

## Endpoints

### Products

#### List Public Products
```http
GET /products
```

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20)
- `sort` (string): Sort by (relevance, price, rating)
- `category` (string): Filter by category

**Response**:
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Digital Course",
      "price": 99900,
      "description": "Learn to code",
      "category": "education",
      "rating": 4.8,
      "reviews": 150,
      "creatorId": "creator_123",
      "creator": {
        "id": "creator_123",
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

---

#### Get Product Details
```http
GET /products/{id}
```

**Response**:
```json
{
  "product": {
    "id": "prod_123",
    "name": "Digital Course",
    "description": "Full description",
    "longDescription": "Detailed description",
    "price": 99900,
    "category": "education",
    "tags": ["javascript", "web"],
    "images": ["https://..."],
    "creator": { ... },
    "rating": 4.8,
    "reviews": [...]
  }
}
```

---

### Creator Products (Requires Auth)

#### List My Products
```http
GET /creator/products
Authorization: X-API-Key: your_key
```

**Response**:
```json
{
  "products": [...],
  "total": 5
}
```

---

#### Create Product
```http
POST /creator/products
Authorization: X-API-Key: your_key
Content-Type: application/json

{
  "name": "New Course",
  "description": "Learn React",
  "price": 49900,
  "category": "technology",
  "images": ["https://..."],
  "tags": ["react", "javascript"]
}
```

**Response**: `201 Created`
```json
{
  "product": {
    "id": "prod_new",
    "name": "New Course",
    "status": "draft"
  }
}
```

---

#### Update Product
```http
PUT /creator/products/{id}
Authorization: X-API-Key: your_key

{
  "name": "Updated Name",
  "price": 59900
}
```

---

#### Delete Product
```http
DELETE /creator/products/{id}
Authorization: X-API-Key: your_key
```

---

### Orders (Requires Auth)

#### List My Orders
```http
GET /creator/orders
Authorization: X-API-Key: your_key
```

**Query Parameters**:
- `status` (string): pending, success, failed
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date

**Response**:
```json
{
  "orders": [
    {
      "id": "order_123",
      "productId": "prod_456",
      "productName": "Course Name",
      "customerEmail": "buyer@example.com",
      "amount": 99900,
      "status": "success",
      "createdAt": "2026-02-08T10:30:00Z"
    }
  ],
  "total": 150,
  "revenue": 15000000
}
```

---

#### Get Order Details
```http
GET /creator/orders/{id}
Authorization: X-API-Key: your_key
```

---

### Analytics (Requires Auth)

#### Get Sales Analytics
```http
GET /creator/analytics/sales
Authorization: X-API-Key: your_key
```

**Query Parameters**:
- `period` (string): day, week, month, year
- `startDate`, `endDate` (ISO)

**Response**:
```json
{
  "period": "month",
  "data": [
    {
      "date": "2026-02-01",
      "revenue": 50000,
      "orders": 10,
      "customers": 8
    }
  ],
  "summary": {
    "totalRevenue": 500000,
    "totalOrders": 100,
    "avgOrderValue": 5000
  }
}
```

---

#### Get Product Analytics
```http
GET /creator/products/{id}/analytics
Authorization: X-API-Key: your_key
```

**Response**:
```json
{
  "productId": "prod_123",
  "views": 1500,
  "clicks": 500,
  "conversions": 150,
  "revenue": 150000,
  "conversionRate": 0.1
}
```

---

### Webhooks

#### Register Webhook
```http
POST /webhooks
Authorization: X-API-Key: your_key

{
  "url": "https://your-domain.com/webhooks/creatorly",
  "events": ["order.created", "order.completed", "payout.processed"]
}
```

---

#### Webhook Events

**order.created**
```json
{
  "event": "order.created",
  "data": {
    "orderId": "order_123",
    "productId": "prod_456",
    "amount": 99900,
    "timestamp": "2026-02-08T10:30:00Z"
  }
}
```

**order.completed**
```json
{
  "event": "order.completed",
  "data": {
    "orderId": "order_123",
    "productId": "prod_456",
    "amount": 99900,
    "customerEmail": "buyer@example.com"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "errors": [
    {
      "field": "price",
      "message": "Price must be at least 100"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing API key"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## SDK/Libraries

### JavaScript
```bash
npm install creatorly-sdk
```

```javascript
import { CreatorlyAPI } from 'creatorly-sdk';

const api = new CreatorlyAPI('your_api_key');
const products = await api.products.list();
const order = await api.orders.get('order_123');
```

---

## Webhooks Verification

All webhook requests include a signature header:

```
X-Webhook-Signature: sha256=abc123...
```

Verify signature:
```javascript
const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const body = req.rawBody; // Raw body, not parsed JSON
const secret = 'your_webhook_secret';

const hash = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const verified = hash === signature.replace('sha256=', '');
```

---

## Rate Limit Examples

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 24,000 |
| Business | 10,000 | 240,000 |

---

## Support

- **Email**: api-support@creatorly.app
- **Documentation**: https://docs.creatorly.app
- **Status**: https://status.creatorly.app
- **Community**: https://community.creatorly.app

---

**Last Updated**: February 2026  
**Next Update**: May 2026
