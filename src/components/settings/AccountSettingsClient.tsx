'use client'

import { useState, useTransition } from 'react'
import { User, Mail, Shield, Calendar, Lock, Loader2, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'

interface AccountUser {
    name?: string | null
    email?: string | null
    role?: string
}

export default function AccountSettingsClient({ user }: { user: AccountUser }) {
    const [isPending, startTransition] = useTransition()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        startTransition(async () => {
            try {
                const { changeOwnPassword } = await import('@/lib/actions/settings')
                const result = await changeOwnPassword(currentPassword, newPassword)
                if (result.success) {
                    setSuccess('Password changed successfully')
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setTimeout(() => setSuccess(null), 5000)
                } else {
                    setError(result.error || 'Failed to change password')
                }
            } catch {
                setError('An unexpected error occurred')
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                    <p className="text-sm text-gray-500 mt-1">Your account details</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h4>
                            <p className="text-sm text-gray-500">{user.role || 'No Role'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <User size={18} className="text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{user.name || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Mail size={18} className="text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{user.email || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Shield size={18} className="text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{user.role || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-500 mt-1">Update your account password</p>
                </div>
                <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
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

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Current Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="Min 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Confirm New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="Re-enter new password"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending && <Loader2 size={16} className="animate-spin" />}
                            {isPending ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
