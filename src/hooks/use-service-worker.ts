'use client'

import { useEffect } from 'react'

/**
 * Hook to register the service worker on app load
 * This ensures push notifications work even before user explicitly enables them
 */
export function useServiceWorker() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            // Register service worker after page load
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    })
                    console.log('[SW] Service Worker registered:', registration.scope)
                } catch (error) {
                    console.error('[SW] Service Worker registration failed:', error)
                }
            })
        }
    }, [])
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported'
    }
    return Notification.permission
}
