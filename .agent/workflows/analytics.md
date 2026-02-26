---
description: Tracking page views, DM usage, and conversion rates across the platform.
---
# Workflow 5 — Analytics & Insights

1. **Event Tracking**
   - Storefront hits log `page_view` to `AnalyticsEvent`.
   - DM sends log to `DMLog`.
2. **Aggregation**
   - Background job aggregates raw logs into `DashboardMetricCache`.
3. **Display**
   - Dashboard renders charts for MRR, Visitors, and AutoDM conversion.
4. **Export**
   - CSV export for high-tier plans.
