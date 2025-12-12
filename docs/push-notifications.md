# Push Notifications Setup Guide

This document explains how to set up and configure browser push notifications for the Wet & Dry ERP system.

## Overview

The push notification system allows users to receive real-time alerts even when the app is not in focus, including:
- Approval requests (inventory, stock transactions, material requests)
- Low stock & critical silo level alerts
- Maintenance due reminders
- Exception reports
- Production completion notifications

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Browser   │────▶│  Service     │────▶│   Push        │
│   (Client)  │     │  Worker      │     │   Notification│
└─────────────┘     └──────────────┘     └───────────────┘
       │                                          ▲
       │ Subscribe                                │
       ▼                                          │
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Next.js    │────▶│  web-push    │────▶│   Push        │
│  Server     │     │  Library     │     │   Service     │
└─────────────┘     └──────────────┘     └───────────────┘
```

## Setup Instructions

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for secure push notifications.

**Option A: Use the included script**
```bash
npx ts-node scripts/generate-vapid-keys.ts
```

**Option B: Generate online**
Visit: https://web-push-codelab.glitch.me/

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Web Push Notification Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@wetndry.com
```

**Important:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Safe to expose (used client-side for subscription)
- `VAPID_PRIVATE_KEY` - **KEEP SECRET!** (used server-side for sending)
- `VAPID_SUBJECT` - Must be a mailto: or https:// URL

### 3. Restart the Development Server

```bash
npm run dev
```

## How It Works

### User Flow

1. **User logs in** → Service worker is registered automatically
2. **Prompt appears** → After 3 seconds, user is prompted to enable notifications
3. **User enables** → Browser creates push subscription, saved to database
4. **Events trigger** → Server creates notification + sends push via web-push library
5. **Push arrives** → Service worker shows native browser notification
6. **User clicks** → Navigated to relevant page in the app

### Technical Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Service Worker | `public/sw.js` | Handles push events, shows notifications |
| Web Push Library | `src/lib/web-push.ts` | Server-side push sending |
| Push Prompt | `src/components/notifications/PushNotificationPrompt.tsx` | User opt-in UI |
| SW Provider | `src/components/providers/ServiceWorkerProvider.tsx` | Registers SW on app load |
| Settings | `src/components/notifications/NotificationSettings.tsx` | User preferences UI |

### Database Schema

```prisma
model UserNotificationPreference {
  id               String   @id @default(cuid())
  userId           String   @unique
  pushEnabled      Boolean  @default(false)
  pushSubscription String?  // JSON string of PushSubscription
  preferences      String?  // JSON string of per-type preferences
  // ... timestamps
}
```

## Notification Types

The system supports 18 notification types across 6 categories:

| Category | Types | Priority |
|----------|-------|----------|
| Approvals | new_inventory_item, stock_transaction_pending, material_request_pending | High |
| Approval Decisions | item_approved/rejected, transaction_approved/rejected | High |
| Inventory Alerts | low_stock_alert, silo_level_critical | Critical |
| Fleet | maintenance_due_date/mileage, document_expiring, spare_parts_low | Medium-High |
| Exceptions | new_exception, exception_resolved | High/Low |
| Production | production_completed, material_shortage | Low/High |
| System | user_created, role_changed | Low/Medium |

## Testing

### Send a Test Notification

1. Go to **Settings → Notifications**
2. Enable push notifications
3. Click **"Send Test Notification"**

### Manual Testing via Code

```typescript
import { testPushNotificationForCurrentUser } from '@/lib/actions/notifications'

// In a server action or API route:
const result = await testPushNotificationForCurrentUser()
console.log(result) // { success: true } or { success: false, error: '...' }
```

## Troubleshooting

### Notifications Not Appearing

1. **Check browser permissions** - Ensure notifications are allowed for the site
2. **Check VAPID keys** - Verify keys are correctly set in environment
3. **Check subscription** - User must have enabled notifications
4. **Check console** - Look for [SW] or [WebPush] prefixed logs

### "VAPID keys not configured" Error

- Ensure both `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set
- Restart the development server after adding keys

### Subscription Expired Errors

- Subscriptions can expire if the browser invalidates them
- The system automatically clears expired subscriptions
- User will need to re-enable notifications

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ⚠️ Limited (iOS 16.4+, macOS Ventura+) |
| Opera | ✅ Full support |

## Security Considerations

1. **VAPID Private Key** - Never expose in client-side code or commit to repository
2. **Subscription Data** - Contains endpoint URLs, stored securely in database
3. **Permission** - Always request user consent before subscribing
4. **HTTPS Required** - Push notifications only work on secure origins (or localhost)

## Production Deployment

1. Generate new VAPID keys for production (don't reuse dev keys)
2. Set environment variables in your hosting platform
3. Ensure HTTPS is enabled
4. Test notifications work after deployment
