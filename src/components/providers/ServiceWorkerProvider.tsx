'use client'

import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Service Worker Provider
 * Registers the service worker on app load and handles updates
 */
export default function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
    const handleSWUpdate = useCallback((registration: ServiceWorkerRegistration) => {
        // Show update notification when new SW is available
        toast.info('App update available', {
            description: 'Refresh to get the latest version',
            action: {
                label: 'Refresh',
                onClick: () => {
                    // Tell the waiting SW to take over
                    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                },
            },
            duration: Infinity,
        })
    }, [])

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return

        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('[SW] Service workers not supported')
            return
        }

        const registerServiceWorker = async () => {
            try {
                // Check for existing registration
                const existingReg = await navigator.serviceWorker.getRegistration()
                
                if (existingReg) {
                    console.log('[SW] Existing service worker found')
                    
                    // Check for updates
                    existingReg.update().catch(console.error)
                    
                    // Handle waiting worker (update available)
                    if (existingReg.waiting) {
                        handleSWUpdate(existingReg)
                    }
                    
                    // Listen for new waiting workers
                    existingReg.addEventListener('updatefound', () => {
                        const newWorker = existingReg.installing
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New SW installed and waiting
                                    handleSWUpdate(existingReg)
                                }
                            })
                        }
                    })
                    
                    return
                }

                // Register new service worker
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none', // Always check for updates
                })

                console.log('[SW] Service worker registered:', registration.scope)

                // Listen for updates on new registration
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // Update available
                                    handleSWUpdate(registration)
                                } else {
                                    // First install
                                    console.log('[SW] Service worker installed for the first time')
                                }
                            }
                        })
                    }
                })

            } catch (error) {
                console.error('[SW] Registration failed:', error)
            }
        }

        // Handle controller change (when user accepts update)
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return
            refreshing = true
            window.location.reload()
        })

        // Register after page load to not block rendering
        if (document.readyState === 'complete') {
            registerServiceWorker()
        } else {
            window.addEventListener('load', registerServiceWorker, { once: true })
        }

        // Cleanup
        return () => {
            window.removeEventListener('load', registerServiceWorker)
        }
    }, [handleSWUpdate])

    return <>{children}</>
}

/**
 * Hook to manually trigger service worker update check
 */
export function useServiceWorkerUpdate() {
    const checkForUpdates = useCallback(async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
                await registration.update()
                return true
            }
        }
        return false
    }, [])

    return { checkForUpdates }
}
