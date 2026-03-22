# Creatorly API Path Reference

## Creator APIs
- Dashboard summary: GET /api/dashboard/summary (not /api/creator/dashboard)
- Products: GET/POST /api/creator/products (not /api/products — that requires creator auth)
- Orders: GET /api/creator/orders
- Analytics: GET /api/creator/analytics

## Public APIs (no auth required)
- Public product: GET /api/products/public/[username]/[slug]
- Plans: GET /api/plans
- Health: GET /api/health

## Auth-protected returning 401 (correct behavior)
- /api/admin/* — returns 401 for non-admin
- /api/creator/* — returns 401 for unauthenticated
