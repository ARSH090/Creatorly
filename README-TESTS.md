# Creatorly Test Suite

Comprehensive test suite for the Creatorly platform, covering frontend, backend, database, and security.

## 🏗️ Architecture
- **Auth**: Clerk
- **Database**: MongoDB
- **Payments**: Razorpay, Stripe, PayPal
- **Storage**: AWS S3
- **Test Engine**: TestSprite

## 🚀 Running Tests

### 1. Setup Environment
Ensure you have a `.env.test` file in the root directory.

### 2. Local Execution
```bash
# Run all tests
npm run test:all

# Run only backend tests
npm run test:api

# Run only E2E tests
playwright test
```

### 3. TestSprite Dashboard
To review and modify tests interactively:
```bash
# Initialize and open dashboard
testsprite open
```

## 📂 Test Structure
- `testsprite_tests/`: TestSprite spec files (Parts 1-10).
- `__tests__/`: Jest/Vitest unit and integration tests.
- `e2e/`: Playwright end-to-end flows.

## 🛡️ Security Tests
The suite includes automated checks for:
- SQL Injection protection.
- XSS sanitization.
- CSRF protection.
- Rate limiting on sensitive endpoints.

## 📊 Coverage
Target coverage is **90%+**. Run coverage reports via:
```bash
npm run test:coverage
```
