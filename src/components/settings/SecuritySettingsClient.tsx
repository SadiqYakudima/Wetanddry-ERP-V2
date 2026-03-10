'use client'

import { useState, useTransition } from 'react'
import { Shield, Key, Clock, Loader2, Check, AlertTriangle, Users } from 'lucide-react'

interface SystemSettings {
    passwordMinLength: number
    sessionTimeoutMins: number
}

export default function SecuritySettingsClient({ settings }: { settings: SystemSettings }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            passwordMinLength: parseInt(formData.get('passwordMinLength') as string) || 6,
            sessionTimeoutMins: parseInt(formData.get('sessionTimeoutMins') as string) || 480,
        }

        startTransition(async () => {
            try {
                const { updateSystemSettings } = await import('@/lib/actions/settings')
                const result = await updateSystemSettings(data)
                if (result.success) {
                    setSuccess('Security settings updated successfully')
                    setTimeout(() => setSuccess(null), 5000)
                } else {
                    setError('Failed to update settings')
                }
            } catch {
                setError('An unexpected error occurred')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                    <Check size={16} />
                    {success}
                </div>
            )}

            {/* Password Policy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <Key size={20} className="text-amber-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Password Policy</h3>
                        <p className="text-sm text-gray-500">Configure password requirements for all users</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="max-w-md">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Minimum Password Length</label>
                        <input
                            type="number"
                            name="passwordMinLength"
                            defaultValue={settings.passwordMinLength}
                            min={4}
                            max={32}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum number of characters required (4 - 32)</p>
                    </div>
                </div>
            </div>

            {/* Session Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <Clock size={20} className="text-blue-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Session Settings</h3>
                        <p className="text-sm text-gray-500">Control user session behavior</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="max-w-md">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Session Timeout (minutes)</label>
                        <select
                            name="sessionTimeoutMins"
                            defaultValue={settings.sessionTimeoutMins}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        >
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={240}>4 hours</option>
                            <option value={480}>8 hours</option>
                            <option value={720}>12 hours</option>
                            <option value={1440}>24 hours</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Users will be logged out after this period of inactivity</p>
                    </div>
                </div>
            </div>

            {/* Role Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <Users size={20} className="text-purple-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Role Permissions Overview</h3>
                        <p className="text-sm text-gray-500">Access levels for each role in the system</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                role: 'Super Admin',
                                color: 'bg-red-50 border-red-200 text-red-800',
                                dot: 'bg-red-500',
                                access: 'Full system access, user management, all approvals, system settings'
                            },
                            {
                                role: 'Manager',
                                color: 'bg-blue-50 border-blue-200 text-blue-800',
                                dot: 'bg-blue-500',
                                access: 'View operations, approve requests/transactions, manage CRM & expenses'
                            },
                            {
                                role: 'Storekeeper',
                                color: 'bg-amber-50 border-amber-200 text-amber-800',
                                dot: 'bg-amber-500',
                                access: 'Create inventory items, stock transactions, material requests, log production'
                            },
                            {
                                role: 'Accountant',
                                color: 'bg-green-50 border-green-200 text-green-800',
                                dot: 'bg-green-500',
                                access: 'View-only operations, financial reports, manage expenses, CRM access'
                            },
                        ].map(r => (
                            <div key={r.role} className={`p-4 rounded-xl border ${r.color}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                                    <span className="font-semibold text-sm">{r.role}</span>
                                </div>
                                <p className="text-xs opacity-80">{r.access}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    {isPending && <Loader2 size={16} className="animate-spin" />}
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}
