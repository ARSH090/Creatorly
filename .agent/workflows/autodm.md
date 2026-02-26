---
description: Instagram AutoDM workflow including comment triggers, follow-first checks, and queue-based delivery.
---
# Workflow 3 — AutoDM & Follow-First

1. **Webhook Receipt**
   - POST to `/api/webhooks/instagram`.
   - Verify signature.
2. **Trigger Processing**
   - Match comment keyword against rules.
   - Check deduplication (24h limit).
3. **Follow-First Logic**
   - Check if commenter follows creator via Graph API.
   - If NO: Send 'follow first' DM and save to `autodm_pending`.
   - If YES: Add content DM to queue.
4. **Delivery Queue**
   - Process batches every 30s.
   - Rate limit check (200 DMs/hr).
   - Random delay (2-5s) between sends.
5. **Follow Event Handling**
   - When user follows, check `autodm_pending` for waiting DMs.
