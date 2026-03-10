'use client'

import { useState, useTransition } from 'react'
import { Building2, Loader2, Check, AlertTriangle, DollarSign } from 'lucide-react'

interface SystemSettings {
    id: string
    companyName: string
    companyEmail: string | null
    companyPhone: string | null
    companyAddress: string | null
    currency: string
    currencySymbol: string
    defaultLowStockThreshold: number
    defaultDrumLiters: number
    defaultGallonLiters: number
    passwordMinLength: number
    sessionTimeoutMins: number
    updatedBy: string | null
    updatedAt: Date
}

export default function SystemSettingsClient({ settings }: { settings: SystemSettings }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        const formData = new FormData(e.currentTarget)

        const data = {
            companyName: formData.get('companyName') as string,
            companyEmail: formData.get('companyEmail') as string || undefined,
            companyPhone: formData.get('companyPhone') as string || undefined,
            companyAddress: formData.get('companyAddress') as string || undefined,
            currency: formData.get('currency') as string,
            currencySymbol: formData.get('currencySymbol') as string,
        }

        startTransition(async () => {
            try {
                const { updateSystemSettings } = await import('@/lib/actions/settings')
                const result = await updateSystemSettings(data)
                if (result.success) {
                    setSuccess('System settings updated successfully')
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

            {/* Company Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <Building2 size={20} className="text-blue-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
                        <p className="text-sm text-gray-500">Basic company details used across the system</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Company Name</label>
                        <input
                            type="text"
                            name="companyName"
                            defaultValue={settings.companyName}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
                        <input
                            type="email"
                            name="companyEmail"
                            defaultValue={settings.companyEmail || ''}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="info@company.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Phone</label>
                        <input
                            type="text"
                            name="companyPhone"
                            defaultValue={settings.companyPhone || ''}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="+234..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Address</label>
                        <textarea
                            name="companyAddress"
                            defaultValue={settings.companyAddress || ''}
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                            placeholder="Company address"
                        />
                    </div>
                </div>
            </div>

            {/* Currency Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <DollarSign size={20} className="text-green-600" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Currency</h3>
                        <p className="text-sm text-gray-500">Default currency used for pricing and reports</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Currency Code</label>
                        <select
                            name="currency"
                            defaultValue={settings.currency}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        >
                            <option value="NGN">NGN - Nigerian Naira</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Currency Symbol</label>
                        <input
                            type="text"
                            name="currencySymbol"
                            defaultValue={settings.currencySymbol}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="₦"
                        />
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            {settings.updatedBy && (
                <p className="text-xs text-gray-400 text-right">
                    Last updated by {settings.updatedBy} on {new Date(settings.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
            )}

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
