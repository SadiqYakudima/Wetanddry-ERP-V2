'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { checkPermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

// ==================== ACCOUNT SETTINGS ====================

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters' }
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return { success: false, error: 'User not found' }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
        return { success: false, error: 'Current password is incorrect' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword }
    })

    return { success: true }
}

export async function getOwnProfile() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        }
    })

    return user
}

// ==================== SYSTEM SETTINGS ====================

export async function getSystemSettings() {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } })

    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: { id: 'default' }
        })
    }

    return settings
}

export async function updateSystemSettings(data: {
    companyName?: string
    companyEmail?: string
    companyPhone?: string
    companyAddress?: string
    currency?: string
    currencySymbol?: string
    defaultLowStockThreshold?: number
    defaultDrumLiters?: number
    defaultGallonLiters?: number
    passwordMinLength?: number
    sessionTimeoutMins?: number
}) {
    const session = await auth()
    if (!session?.user?.role) throw new Error('Unauthorized')
    checkPermission(session.user.role, 'manage_system_settings')

    const settings = await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: {
            ...data,
            updatedBy: session.user.name || session.user.email || 'Unknown',
        },
        create: {
            id: 'default',
            ...data,
            updatedBy: session.user.name || session.user.email || 'Unknown',
        }
    })

    revalidatePath('/settings')
    return { success: true, data: settings }
}
