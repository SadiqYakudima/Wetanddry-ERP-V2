'use server'

import webpush from 'web-push'
import prisma from '@/lib/prisma'

// ==================== CONFIGURATION ====================

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@wetndry.com'

// Track if VAPID is configured
let vapidConfigured = false

// Configure web-push with VAPID keys (only once)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
        vapidConfigured = true
        console.log('[WebPush] VAPID keys configured successfully')
    } catch (error) {
        console.error('[WebPush] Failed to configure VAPID keys:', error)
    }
} else {
    console.log('[WebPush] VAPID keys not configured - push notifications disabled')
}

// ==================== TYPES ====================

export interface PushNotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
    data?: {
        url?: string
        type?: string
        entityType?: string
        entityId?: string
        notificationId?: string
        [key: string]: any
    }
    actions?: Array<{
        action: string
        title: string
        icon?: string
    }>
}

export interface SendPushResult {
    success: boolean
    error?: string
    skipped?: boolean
}

// ==================== URL MAPPING ====================

// Entity type to URL mapping for click-through navigation
const getNotificationUrl = (entityType?: string, entityId?: string): string => {
    if (!entityType) return '/dashboard'
    
    const routes: Record<string, string> = {
        inventory_item: '/inventory',
        stock_transaction: '/inventory',
        material_request: '/inventory',
        exception: '/exceptions',
        truck: entityId ? `/trucks/${entityId}` : '/trucks',
        maintenance: '/trucks',
        spare_part: '/trucks/parts',
        production: '/production',
        user: '/users',
    }
    
    return routes[entityType] || '/dashboard'
}

// ==================== DEFAULT ACTIONS ====================

// Get default action buttons based on notification type
function getDefaultActions(type?: string): Array<{ action: string; title: string }> {
    if (!type) return []

    const actionMap: Record<string, Array<{ action: string; title: string }>> = {
        // Approval notifications
        new_inventory_item: [
            { action: 'view', title: 'Review' },
            { action: 'dismiss', title: 'Later' },
        ],
        stock_transaction_pending: [
            { action: 'view', title: 'Approve' },
            { action: 'dismiss', title: 'Later' },
        ],
        material_request_pending: [
            { action: 'view', title: 'Review' },
            { action: 'dismiss', title: 'Later' },
        ],
        // Alert notifications
        low_stock_alert: [
            { action: 'view', title: 'View Stock' },
        ],
        silo_level_critical: [
            { action: 'view', title: 'Check Silo' },
        ],
        material_shortage: [
            { action: 'view', title: 'View Inventory' },
        ],
        // Exception notifications
        new_exception: [
            { action: 'view', title: 'View Details' },
        ],
        // Maintenance notifications
        maintenance_due_date: [
            { action: 'view', title: 'Schedule' },
        ],
        maintenance_due_mileage: [
            { action: 'view', title: 'Schedule' },
        ],
        document_expiring: [
            { action: 'view', title: 'View Document' },
        ],
    }

    return actionMap[type] || []
}

// ==================== CORE FUNCTIONS ====================

/**
 * Send a push notification to a specific user
 * Checks if user has push enabled and valid subscription
 */
export async function sendPushNotification(
    userId: string,
    notification: PushNotificationPayload
): Promise<SendPushResult> {
    // Check if VAPID keys are configured
    if (!vapidConfigured) {
        return { success: false, skipped: true, error: 'VAPID keys not configured' }
    }

    try {
        // Get user's push subscription preference
        const preference = await prisma.userNotificationPreference.findUnique({
            where: { userId }
        })

        // Check if user has push enabled
        if (!preference?.pushEnabled) {
            return { success: false, skipped: true, error: 'Push not enabled for user' }
        }

        // Check if user has a valid subscription
        if (!preference?.pushSubscription) {
            return { success: false, skipped: true, error: 'No push subscription found' }
        }

        // Parse the stored subscription
        let subscription: webpush.PushSubscription
        try {
            subscription = JSON.parse(preference.pushSubscription)
            
            // Validate subscription structure
            if (!subscription.endpoint || !subscription.keys) {
                throw new Error('Invalid subscription structure')
            }
        } catch (parseError) {
            console.error('[WebPush] Invalid subscription JSON for user:', userId)
            // Clear invalid subscription
            await prisma.userNotificationPreference.update({
                where: { userId },
                data: { pushSubscription: null }
            }).catch(() => {})
            return { success: false, error: 'Invalid subscription data' }
        }

        // Check user's notification preferences for this specific type
        if (notification.data?.type && preference.preferences) {
            try {
                const prefs = JSON.parse(preference.preferences)
                const typePref = prefs[notification.data.type]
                if (typePref && typePref.push === false) {
                    return { success: false, skipped: true, error: 'User disabled push for this type' }
                }
            } catch {
                // If can't parse preferences, send anyway
            }
        }

        // Build the notification payload
        const payload: PushNotificationPayload = {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icon.svg',
            badge: notification.badge || '/icon.svg',
            tag: notification.tag || notification.data?.type || `notification-${Date.now()}`,
            priority: notification.priority || 'medium',
            data: {
                ...notification.data,
                url: notification.data?.url || getNotificationUrl(
                    notification.data?.entityType,
                    notification.data?.entityId
                ),
                timestamp: Date.now(),
            },
            actions: notification.actions || getDefaultActions(notification.data?.type),
        }

        // Send the push notification
        await webpush.sendNotification(
            subscription, 
            JSON.stringify(payload),
            {
                TTL: 86400, // 24 hours
                urgency: getUrgency(notification.priority),
            }
        )

        console.log('[WebPush] Successfully sent notification to user:', userId)
        return { success: true }

    } catch (error: any) {
        // Handle specific web-push errors
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is no longer valid (user unsubscribed or expired)
            console.log('[WebPush] Subscription expired for user:', userId)
            
            // Remove invalid subscription
            await prisma.userNotificationPreference.update({
                where: { userId },
                data: { 
                    pushSubscription: null,
                    pushEnabled: false 
                }
            }).catch(err => {
                console.error('[WebPush] Failed to clear invalid subscription:', err)
            })
            
            return { success: false, error: 'Subscription expired' }
        }

        if (error.statusCode === 413) {
            // Payload too large
            console.error('[WebPush] Payload too large for user:', userId)
            return { success: false, error: 'Notification payload too large' }
        }

        if (error.statusCode === 429) {
            // Too many requests
            console.warn('[WebPush] Rate limited for user:', userId)
            return { success: false, error: 'Rate limited' }
        }

        console.error('[WebPush] Failed to send notification:', error.message || error)
        return { success: false, error: error.message || 'Failed to send push notification' }
    }
}

/**
 * Map priority to web-push urgency
 */
function getUrgency(priority?: string): 'very-low' | 'low' | 'normal' | 'high' {
    switch (priority) {
        case 'critical':
            return 'high'
        case 'high':
            return 'high'
        case 'medium':
            return 'normal'
        case 'low':
            return 'low'
        default:
            return 'normal'
    }
}

/**
 * Send push notification to multiple users (batch)
 */
export async function sendPushNotificationToMany(
    userIds: string[],
    notification: PushNotificationPayload
): Promise<{ success: number; failed: number; skipped: number }> {
    let success = 0
    let failed = 0
    let skipped = 0

    // Send in batches to avoid overwhelming the push service
    const batchSize = 10
    
    for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        
        const results = await Promise.allSettled(
            batch.map(userId => sendPushNotification(userId, notification))
        )
        
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    success++
                } else if (result.value.skipped) {
                    skipped++
                } else {
                    failed++
                }
            } else {
                failed++
            }
        })

        // Small delay between batches to be nice to the push service
        if (i + batchSize < userIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    return { success, failed, skipped }
}

/**
 * Check if web push is properly configured
 */
export function isWebPushConfigured(): boolean {
    return vapidConfigured
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY
}

/**
 * Test push notification - for debugging
 */
export async function testPushNotification(userId: string): Promise<SendPushResult> {
    return sendPushNotification(userId, {
        title: '🔔 Test Notification',
        body: 'Push notifications are working! You will receive alerts even when the app is in the background.',
        priority: 'medium',
        data: {
            type: 'test',
            url: '/dashboard',
        },
    })
}
