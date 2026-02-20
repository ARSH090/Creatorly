# AutoDM Implementation TODO

## Phase 1: Database & Models
- [x] DM-001: Extend Lead model with DM fields (dmStatus, dmProvider, dmSentAt, dmError, etc.)
- [x] DM-002: SocialAccount model already exists with Instagram credentials
- [x] DM-003: Add indexes for DM queries
- [x] DM-004: DMLog model already has all required fields

## Phase 2: Backend Services  
- [x] DM-005: InstagramService already has token refresh
- [ ] DM-006: Implement token refresh cron job
- [x] DM-007: Webhook endpoint for Instagram message status
- [x] DM-008: Verify webhook signature validation
- [x] DM-009: Rate limit handling (circuit breaker already implemented)

## Phase 3: API Endpoints
- [x] DM-010: POST `/api/dm/send` endpoint
- [x] DM-011: GET `/api/dm/status/:leadId` endpoint  
- [x] DM-012: POST `/api/dm/retry/:leadId` endpoint
- [x] DM-013: Add authentication to DM endpoints (uses Clerk)
- [x] DM-014: Input validation

## Phase 4: Queue System
- [x] DM-015: Instagram queue configured with retry options
- [x] DM-016: Instagram worker job processing
- [x] DM-017: WhatsApp placeholder worker
- [x] DM-018: Error handling for worker failures
- [ ] DM-019: Dead letter queue setup

## Phase 5: Frontend Integration
- [x] DM-020: LeadFormModal updates (already exists)
- [x] DM-021: DMStatusBadge component created
- [ ] DM-022: WhatsApp deep link button integration
- [ ] DM-023: Creator Dashboard DM section
- [ ] DM-024: Admin Dashboard DM overview

## Phase 6: Instagram Authentication
- [ ] DM-025: Instagram OAuth flow
- [ ] DM-026: OAuth callback handling
- [ ] DM-027: Instagram connection UI
- [ ] DM-028: Disconnect functionality

## Phase 7: Testing
- [ ] DM-029: Unit tests for InstagramService
- [ ] DM-030: Unit tests for WhatsAppService
- [ ] DM-031: API endpoint integration tests
- [ ] DM-032: Queue worker tests
- [ ] DM-033: E2E test for Instagram DM flow

## Phase 8: Deployment
- [ ] DM-034: Configure environment variables
- [ ] DM-035: Set up Redis for production
- [ ] DM-036: Deploy worker service
- [ ] DM-037: Configure cron for token refresh
- [ ] DM-038: Set up monitoring

---

## Files Created/Modified

### New Files:
- `src/app/api/dm/send/route.ts` - DM send API endpoint
- `src/app/api/dm/status/[leadId]/route.ts` - DM status API endpoint
- `src/app/api/dm/retry/[leadId]/route.ts` - DM retry API endpoint
- `src/components/autodm/DMStatusBadge.tsx` - Status badge component
- `src/app/api/webhooks/instagram/route.ts` - Instagram webhook handler
- `AUTO_DM_IMPLEMENTATION_PLAN.md` - Comprehensive implementation plan
- `TODO_AUTODM.md` - This TODO list

### Modified Files:
- `src/lib/models/Lead.ts` - Added DM fields
- `src/lib/queue.ts` - Fixed and enhanced queue worker

### Existing Files (Ready to Use):
- `src/lib/models/DMLog.ts` - DM logging model
- `src/lib/models/SocialAccount.ts` - Instagram credentials storage
- `src/lib/services/instagram.ts` - Full Instagram API service
- `src/lib/services/whatsapp.ts` - WhatsApp placeholder service

---

## Next Steps Priority

1. **High Priority**: Complete DM-022 (WhatsApp deep link integration in frontend)
2. **High Priority**: Complete DM-023 (Creator Dashboard DM section)
3. **Medium Priority**: DM-025-028 (Instagram OAuth flow)
4. **Medium Priority**: DM-006 (Token refresh cron job)
5. **Lower Priority**: Testing and Deployment phases
