// Service Worker for Push Notifications
// Version 1.1.0

const CACHE_NAME = 'wetdry-erp-v1';

// Default notification options (use SVG icon which has better support)
const DEFAULT_ICON = '/icon.svg';
const DEFAULT_BADGE = '/icon.svg';

// Install event - activate immediately
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v1.1.0...');
    self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ])
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    // Default notification data
    let data = {
        title: 'Wet & Dry ERP',
        body: 'You have a new notification',
        icon: DEFAULT_ICON,
        badge: DEFAULT_BADGE,
        tag: 'default',
        priority: 'medium',
        data: { url: '/dashboard' }
    };

    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
            console.log('[SW] Push data:', data);
        } catch (e) {
            console.error('[SW] Error parsing push data:', e);
            // Try as text
            try {
                data.body = event.data.text();
            } catch (e2) {
                console.error('[SW] Error reading push text:', e2);
            }
        }
    }

    // Build notification options
    const options = {
        body: data.body,
        icon: data.icon || DEFAULT_ICON,
        badge: data.badge || DEFAULT_BADGE,
        tag: data.tag || `notification-${Date.now()}`,
        vibrate: getVibrationPattern(data.priority),
        data: {
            ...data.data,
            timestamp: Date.now(),
        },
        // Show actions if provided
        actions: data.actions || [],
        // Keep notification visible for critical/high priority
        requireInteraction: data.priority === 'critical' || data.priority === 'high',
        // Renotify when same tag is used (update existing notification)
        renotify: true,
        // Silent for low priority
        silent: data.priority === 'low',
    };

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('[SW] Notification shown successfully'))
            .catch((err) => console.error('[SW] Failed to show notification:', err))
    );
});

// Get vibration pattern based on priority
function getVibrationPattern(priority) {
    switch (priority) {
        case 'critical':
            return [200, 100, 200, 100, 200]; // Urgent pattern
        case 'high':
            return [200, 100, 200]; // Important pattern
        case 'medium':
            return [100, 50, 100]; // Normal pattern
        case 'low':
        default:
            return []; // No vibration for low priority
    }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    // Close the notification
    event.notification.close();

    // Handle action button clicks
    const action = event.action;
    const notificationData = event.notification.data || {};
    
    let urlToOpen = notificationData.url || '/dashboard';

    // Handle specific actions
    if (action === 'view') {
        // Use the URL from notification data
        urlToOpen = notificationData.url || '/dashboard';
    } else if (action === 'dismiss') {
        // Just close, don't navigate
        return;
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        }).then((clientList) => {
            // Try to find an existing window and navigate/focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    // Navigate to the URL and focus
                    return client.navigate(urlToOpen).then(() => client.focus());
                }
            }
            // No existing window found - open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close handler (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
    // Could send analytics here
});

// Background sync for offline notification reads
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        console.log('[SW] Syncing notifications...');
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Future: Sync any queued notification reads when back online
    console.log('[SW] Notification sync complete');
}

// Message handler for communication with the main app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
