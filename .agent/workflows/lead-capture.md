---
description: Lead management from newsletter signup and lead magnets.
---
# Workflow 6 — Lead Capture & Marketing

1. **Capture**
   - Newsletter signup form on storefront.
   - Freebie/Lead magnet delivery triggers `lead_capture` event.
2. **Nurturing**
   - Add lead to `Lead` model.
   - Trigger automated welcome email sequence.
3. **Broadcasts**
   - Admin/Creator sends dashboard-initiated broadcasts.
   - Queue-based delivery with unsubscribe handling.
