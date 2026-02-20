# AutoDM Hub - Auto DM Feature Implementation Plan

## Executive Summary

This document provides a detailed, step-by-step implementation plan for the Auto DM feature of the AutoDM Hub platform. The feature supports:
- **Instagram DM**: Full production-ready implementation using Instagram Graph API
- **WhatsApp DM**: Placeholder with deep link support ("Coming Soon")

---

## Current Codebase Analysis

### Existing Components Found:
1. ✅ `src/lib/models/DMLog.ts` - DM logging model with provider, status, delivery tracking
2. ✅ `src/lib/models/Lead.ts` - Lead model (needs DM fields extension)
3. ✅ `src/lib/services/instagram.ts` - Full Instagram API service with circuit breaker, retries
4. ✅ `src/lib/services/whatsapp.ts` - WhatsApp placeholder service with deep link
5. ✅ `src/lib/queue.ts` - BullMQ queue with Instagram and WhatsApp workers
6. ✅ `src/lib/services/meta.ts` - Meta Graph API service
7. ✅ `src/components/autodm/` - Existing AutoDM UI components
8. ✅ `src/app/autodm/page.tsx` - Main AutoDM Hub page
9. ✅ `src/components/autodm/LeadFormModal.tsx` - Lead capture modal

### Components Created During This Plan:
1. ✅ `src/app/api/dm/send/route.ts` - DM send endpoint
2. ✅ `src/app/api/dm/status/[leadId]/route.ts` - DM status endpoint
3. ✅ `src/app/api/dm/retry/[leadId]/route.ts` - DM retry endpoint
4. ✅ `src/components/autodm/DMStatusBadge.tsx` - Status badge component

---

## Implementation Phases

### Phase 1: Database & Models (Week 1)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-001 | Extend Lead model with DM fields | None | Lead schema includes dmStatus, dmProvider, dmSentAt, dmError, dmMessageId |
| DM-002 | Create SocialAccount model for Instagram credentials | None | Schema stores pageAccessToken, instagramBusinessId, tokenExpiry |
| DM-003 | Add indexes | for DM queries DM-001, DM-002 | Efficient queries on lead DM status and creator DM logs |
| DM-004 | Verify DMLog model has all required fields | None | Includes provider, status, errorCode, errorDetails, metadata |

### Phase 2: Backend Services (Week 1-2)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-005 | Enhance InstagramService with token refresh | DM-002 | Auto-refresh long-lived tokens before expiry |
| DM-006 | Implement token refresh cron job | DM-005 | Tokens refreshed every 50 days (before 60-day expiry) |
| DM-007 | Add webhook endpoint for Instagram message status | None | `/api/webhooks/instagram` receives delivery/read updates |
| DM-008 | Verify webhook signature validation | DM-007 | Secure webhook verification implemented |
| DM-009 | Add rate limit handling to Instagram service | Existing | Exponential backoff, circuit breaker active |

### Phase 3: API Endpoints (Week 2)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-010 | Implement POST `/api/dm/send` | DM-001 | Accepts leadId, provider, message; queues job; returns jobId |
| DM-011 | Implement GET `/api/dm/status/:leadId` | DM-001 | Returns DM status, provider, logs for lead |
| DM-012 | Implement POST `/api/dm/retry/:leadId` | DM-010 | Retries failed DM, increments attempt count |
| DM-013 | Add authentication to all DM endpoints | None | Clerk auth required; creator can only access their leads |
| DM-014 | Add input validation | DM-010 | Validate leadId format, provider enum, message length |

### Phase 4: Queue System (Week 2)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-015 | Configure Instagram queue with retry options | Existing queue | 3 attempts, exponential backoff, remove on complete |
| DM-016 | Implement Instagram worker job processing | DM-015 | Processes job, calls InstagramService, updates Lead/DMLog |
| DM-017 | Implement WhatsApp placeholder worker | DM-015 | Logs "coming soon", returns status |
| DM-018 | Add error handling for worker failures | DM-016 | Updates Lead status, creates error log |
| DM-019 | Set up dead letter queue for failed jobs | DM-016 | Failed jobs after max retries moved to DLQ |

### Phase 5: Frontend Integration (Week 2-3)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-020 | Update LeadFormModal to show DM status | Existing modal | Shows success message with DM status after submission |
| DM-021 | Create DMStatusBadge component | None | Shows pending/sent/failed/coming_soon status with icon |
| DM-022 | Add WhatsApp deep link button | DM-021 | "Coming Soon" with clickable wa.me link |
| DM-023 | Create Creator Dashboard DM section | None | Table showing DM logs, status, retry buttons |
| DM-024 | Create Admin Dashboard DM overview | None | Stats: total sent, failed, pending, success rate % |

### Phase 6: Instagram Authentication Flow (Week 3)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-025 | Create Instagram OAuth flow | None | `/api/auth/instagram/connect` initiates OAuth |
| DM-026 | Handle OAuth callback | DM-025 | Exchanges code for token, stores in SocialAccount |
| DM-027 | Create Instagram connection UI | DM-025 | Button to connect Instagram account in settings |
| DM-028 | Add disconnect functionality | DM-026 | Allow creators to disconnect Instagram |

### Phase 7: Testing (Week 3)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-029 | Unit tests for InstagramService | DM-005 | Test send, refresh, error handling with mocks |
| DM-030 | Unit tests for WhatsAppService | DM-006 | Test deep link generation, message building |
| DM-031 | API endpoint integration tests | DM-014 | Test auth, validation, queue enqueuing |
| DM-032 | Queue worker tests | DM-018 | Test job processing, error handling, retries |
| DM-033 | E2E test for Instagram DM flow | DM-028 | Full flow: lead capture → queue → worker → success |

### Phase 8: Deployment (Week 4)

| Task ID | Task Description | Dependencies | Acceptance Criteria |
|---------|------------------|--------------|---------------------|
| DM-034 | Configure environment variables | None | INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, etc. set |
| DM-035 | Set up Redis for production | None | Production Redis instance configured |
| DM-036 | Deploy worker service | DM-019 | Separate worker process running on Railway/Fly.io |
| DM-037 | Configure cron for token refresh | DM-006 | Vercel cron or external scheduler running |
| DM-038 | Set up monitoring | DM-036 | Error tracking, job success metrics |

---

## Environment Variables Required

```
env
# Instagram/Meta
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
META_GRAPH_VERSION=v19.0

# Redis
REDIS_URL=

# Webhook
INSTAGRAM_WEBHOOK_SECRET=
```

---

## API Reference

### POST /api/dm/send
Send a DM to a lead.

**Request:**
```
json
{
  "leadId": "507f1f77bcf86cd799439011",
  "provider": "instagram",
  "message": "Optional custom message"
}
```

**Response (Instagram):**
```
json
{
  "success": true,
  "message": "DM queued successfully",
  "data": {
    "jobId": "abc123",
    "status": "queued",
    "provider": "instagram"
  }
}
```

**Response (WhatsApp):**
```
json
{
  "success": true,
  "message": "WhatsApp DM feature coming soon",
  "data": {
    "status": "coming_soon",
    "provider": "whatsapp",
    "deepLink": "https://wa.me/1234567890?text=..."
  }
}
```

### GET /api/dm/status/:leadId
Get DM status for a lead.

**Response:**
```
json
{
  "success": true,
  "data": {
    "leadId": "507f1f77bcf86cd799439011",
    "dmStatus": "sent",
    "dmProvider": "instagram",
    "dmSentAt": "2024-01-15T10:30:00Z",
    "dmError": null,
    "recentLogs": [...]
  }
}
```

### POST /api/dm/retry/:leadId
Retry a failed DM.

**Response:**
```
json
{
  "success": true,
  "message": "DM retry queued successfully",
  "data": {
    "jobId": "def456",
    "status": "queued"
  }
}
```

---

## WhatsApp Placeholder Implementation

For WhatsApp, the system returns a 501 status with:

1. **Deep Link**: Generated using `https://wa.me/{phone}?text={encodedMessage}`
2. **Message**: "WhatsApp DM feature coming soon! Click below to open WhatsApp."
3. **UI**: Shows "Coming Soon" badge with clickable WhatsApp button

This allows users to still connect with leads manually while the full integration is developed.

---

## Error Handling

| Error Code | Description | Action |
|------------|-------------|--------|
| TOKEN_EXPIRED | Instagram token expired | Trigger token refresh, retry |
| RATE_LIMIT | Too many requests | Exponential backoff, retry |
| NOT_PERMITTED | Recipient hasn't messaged business | Mark failed, suggest manual contact |
| CIRCUIT_OPEN | Too many consecutive failures | Pause for 1 minute, then retry |

---

## Final Validation Checklist

### Manual Tests to Perform:

1. **Lead Capture → Instagram DM Flow**
   - [ ] Submit lead via LeadFormModal
   - [ ] Verify DM queued in Redis
   - [ ] Check worker processes job
   - [ ] Verify DM sent to Instagram
   - [ ] Check Lead status updated to "sent"
   - [ ] Verify DMLog created with correct data

2. **WhatsApp Placeholder Flow**
   - [ ] Select WhatsApp as provider
   - [ ] Verify 501 response received
   - [ ] Check deep link generated correctly
   - [ ] Verify deep link opens WhatsApp with pre-filled message

3. **Error Handling**
   - [ ] Test with invalid leadId (should return 404)
   - [ ] Test with invalid provider (should return 400)
   - [ ] Simulate Instagram API failure
   - [ ] Verify retry mechanism works

4. **Security**
   - [ ] Test unauthenticated request (should return 401)
   - [ ] Test accessing another creator's lead (should return 403)
   - [ ] Verify webhook signature validation

5. **Performance**
   - [ ] Queue 100 jobs, verify all processed
   - [ ] Check worker concurrency handling

---

## Dependencies Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │LeadFormModal│  │DMStatusBadge│  │Creator Dashboard   │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │POST /dm/send│  │GET /dm/status│ │POST /dm/retry      │    │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬──────────┘    │
└─────────┼────────────────┼───────────────────┼────────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │InstagramService │  │ WhatsAppService │  │MetaGraphSvc  │   │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘   │
└───────────┼────────────────────┼─────────────────┼────────────┘
            │                    │                 │
            ▼                    ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Queue System                              │
│  ┌────────────────────┐  ┌────────────────────────────────┐  │
│  │instagramQueue      │  │whatsappQueue                   │  │
│  └─────────┬──────────┘  └────────────┬───────────────────┘  │
└───────────┼──────────────────────────┼──────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Worker Processes                          │
│  ┌────────────────────┐  ┌────────────────────────────────┐  │
│  │InstagramWorker     │  │WhatsAppWorker (placeholder)    │  │
│  └─────────┬──────────┘  └────────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐ │
│  │Lead      │  │DMLog     │  │SocialAccount │  │QueueJob │ │
│  └──────────┘  └──────────┘  └──────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Start with Phase 1**: Extend Lead model and create SocialAccount model
2. **Continue sequentially**: Each phase builds on the previous
3. **Test thoroughly**: Run manual validation checklist before deployment
4. **Monitor in production**: Set up error tracking and metrics

---

*Document Version: 1.0*
*Last Updated: AutoDM Hub Implementation*
