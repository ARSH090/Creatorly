# Core User Dashboard System - Implementation TODO

## Phase 1: Database Models
- [ ] Create src/lib/models/DashboardWidget.ts - Widget configuration
- [ ] Create src/lib/models/DashboardMetricCache.ts - Metric caching
- [ ] Create src/lib/models/AICredit.ts - AI credits tracking
- [ ] Update src/lib/models/Notification.ts - Add dashboard notification types
- [ ] Create src/lib/models/DashboardActivityLog.ts - Activity tracking

## Phase 2: Dashboard Service
- [ ] Create src/lib/services/dashboardService.ts - Core dashboard aggregation logic
- [ ] Create src/lib/services/metricCalculator.ts - Metric calculation logic

## Phase 3: API Routes
- [ ] Create src/app/api/dashboard/summary/route.ts - GET dashboard summary
- [ ] Create src/app/api/dashboard/widgets/route.ts - GET/PUT widgets
- [ ] Create src/app/api/dashboard/notifications/route.ts - GET notifications
- [ ] Create src/app/api/dashboard/notifications/[id]/read/route.ts - PUT notification read
- [ ] Create src/app/api/dashboard/notifications/read-all/route.ts - POST mark all read
- [ ] Create src/app/api/dashboard/activity/route.ts - GET activity log

## Phase 4: Admin Routes
- [ ] Create src/app/api/admin/dashboard/[creatorId]/route.ts - Admin view creator dashboard

## Phase 5: Testing
- [ ] Create unit tests for dashboard service
- [ ] Create integration tests for API endpoints

## Status: In Progress - Phase 1
