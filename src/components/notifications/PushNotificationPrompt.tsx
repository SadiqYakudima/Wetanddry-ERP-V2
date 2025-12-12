'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Smartphone, Check, AlertCircle } from 'lucide-react'
import { updatePushSubscription } from '@/lib/actions/notifications'

interface PushNotificationPromptProps {
    onClose?: () => void
    showOnMount?: boolean
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

// Check if push notifications are supported
const isPushSupported = (): boolean => {
    if (typeof window === 'undefined') return false
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

// Convert VAPID key to Uint8Array for subscription
const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray.buffer
}

export default function PushNotificationPrompt({ onClose, showOnMount = true }: PushNotificationPromptProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'denied'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        // Check if we should show the prompt
        const checkAndShow = async () => {
            if (!showOnMount || !isPushSupported()) return

            // Don't show if VAPID key is not configured
            if (!VAPID_PUBLIC_KEY) {
                console.log('[Push] VAPID key not configured, skipping prompt')
                return
            }

            // Check if user has already made a decision
            const hasSeenPrompt = localStorage.getItem('push-notification-prompted')
            if (hasSeenPrompt) return

            // Check current permission status
            const permission = Notification.permission
            if (permission === 'granted') {
                // Already granted - check if we have a subscription
                try {
                    const registration = await navigator.serviceWorker.getRegistration()
                    if (registration) {
                        const subscription = await registration.pushManager.getSubscription()
                        if (subscription) {
                            // Already subscribed
                            localStorage.setItem('push-notification-prompted', 'true')
                            return
                        }
                    }
                } catch (err) {
                    console.error('[Push] Error checking subscription:', err)
                }
            } else if (permission === 'denied') {
                localStorage.setItem('push-notification-prompted', 'true')
                return
            }

            // Show prompt after a short delay (let page load first)
            setTimeout(() => setIsVisible(true), 3000)
        }

        checkAndShow()
    }, [showOnMount])

    const handleEnable = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage('')

        try {
            // Step 1: Request notification permission
            const permission = await Notification.requestPermission()

            if (permission === 'denied') {
                setStatus('denied')
                localStorage.setItem('push-notification-prompted', 'true')
                return
            }

            if (permission !== 'granted') {
                setStatus('error')
                setErrorMessage('Notification permission not granted')
                return
            }

            // Step 2: Ensure service worker is registered
            let registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
                // Wait for the service worker to be ready
                await navigator.serviceWorker.ready
            }

            // Step 3: Subscribe to push notifications (if VAPID key is configured)
            let subscriptionJson: string | null = null
            
            if (VAPID_PUBLIC_KEY) {
                try {
                    // Check for existing subscription
                    let subscription = await registration.pushManager.getSubscription()
                    
                    if (!subscription) {
                        // Create new subscription
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                        })
                    }

                    subscriptionJson = JSON.stringify(subscription)
                    console.log('[Push] Subscription created successfully')
                } catch (subError: any) {
                    console.warn('[Push] Push subscription failed:', subError.message)
                    // Continue anyway - in-app notifications will still work
                }
            }

            // Step 4: Save subscription to server
            const result = await updatePushSubscription(subscriptionJson, true)
            if (!result.success) {
                throw new Error(result.error || 'Failed to save subscription')
            }

            setStatus('success')
            localStorage.setItem('push-notification-prompted', 'true')

            // Close after showing success
            setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, 2500)

        } catch (error: any) {
            console.error('[Push] Failed to enable push notifications:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [onClose])

    const handleDismiss = useCallback(() => {
        localStorage.setItem('push-notification-prompted', 'true')
        setIsVisible(false)
        onClose?.()
    }, [onClose])

    const handleLater = useCallback(() => {
        // Don't persist - will show again next session
        setIsVisible(false)
        onClose?.()
    }, [onClose])

    if (!isVisible || !isPushSupported()) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-[380px] max-w-[calc(100vw-2rem)]">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>

                {status === 'success' ? (
                    // Success state
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">You&apos;re all set!</h3>
                        <p className="text-sm text-gray-500">
                            You&apos;ll receive notifications for important updates.
                        </p>
                    </div>
                ) : status === 'denied' ? (
                    // Denied state
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications Blocked</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            You can enable notifications later in your browser settings.
                        </p>
                        <button
                            onClick={handleDismiss}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Got it
                        </button>
                    </div>
                ) : status === 'error' ? (
                    // Error state
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h3>
                        <p className="text-sm text-gray-500 mb-4">{errorMessage}</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Try again
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={handleDismiss}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ) : (
                    // Default prompt state
                    <>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Stay Updated
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Get instant notifications for approvals, alerts, and important updates even when you&apos;re not on this page.
                                </p>
                            </div>
                        </div>

                        {/* Benefits */}
                        <ul className="mb-5 space-y-2">
                            {[
                                'Approval requests delivered instantly',
                                'Real-time low stock & maintenance alerts',
                                'Never miss critical exceptions',
                            ].map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check size={16} className="text-green-500 flex-shrink-0" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleLater}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={isLoading}
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={handleEnable}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enabling...
                                    </>
                                ) : (
                                    <>
                                        <Bell size={16} />
                                        Enable Notifications
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// Hook for manual trigger
export function usePushNotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)

    const trigger = () => {
        if (isPushSupported()) {
            setShowPrompt(true)
        }
    }

    const close = () => setShowPrompt(false)

    return { showPrompt, trigger, close }
}

// Utility to check push subscription status
export async function checkPushSubscription(): Promise<{
    supported: boolean
    permission: NotificationPermission | 'unsupported'
    subscribed: boolean
}> {
    if (!isPushSupported()) {
        return { supported: false, permission: 'unsupported', subscribed: false }
    }

    const permission = Notification.permission
    let subscribed = false

    if (permission === 'granted') {
        try {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                subscribed = !!subscription
            }
        } catch {
            // Ignore errors
        }
    }

    return { supported: true, permission, subscribed }
}
