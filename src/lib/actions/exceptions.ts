'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { checkPermission, hasPermission } from '@/lib/permissions'
import { notifyNewException, notifyExceptionResolved } from '@/lib/actions/notifications'


export async function getExceptions() {
    const session = await auth()
    // Gracefully handle missing role or missing permission
    if (!session?.user?.role || !hasPermission(session.user.role, 'view_exceptions')) {
        return []
    }

    return await prisma.exceptionLog.findMany({
        include: { truck: true, recipe: true },
        orderBy: { createdAt: 'desc' }
    })
}

export async function logException(formData: FormData) {
    const type = formData.get('type') as string
    const reason = formData.get('reason') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const truckId = formData.get('truckId') as string || null
    const recipeId = formData.get('recipeId') as string || null
    const notes = formData.get('notes') as string

    const session = await auth()
    if (!session?.user?.role) throw new Error('Unauthorized')
    checkPermission(session.user.role, 'create_exception')


    if (!type || !reason || isNaN(quantity)) {
        throw new Error('Invalid input')
    }

    const exception = await prisma.exceptionLog.create({
        data: {
            type,
            reason,
            quantity,
            unit: 'm3', // Defaulting to concrete volume for now
            truckId,
            recipeId,
            notes,
            resolved: false
        }
    })

    // Notify managers/admins about the new exception
    notifyNewException(exception.id, type, reason, quantity).catch(console.error)

    revalidatePath('/exceptions')
}

export async function resolveException(id: string) {
    const session = await auth()
    if (!session?.user?.role) throw new Error('Unauthorized')
    checkPermission(session.user.role, 'manage_exceptions')

    const exception = await prisma.exceptionLog.findUnique({ where: { id } })
    if (!exception) throw new Error('Exception not found')

    await prisma.exceptionLog.update({
        where: { id },
        data: { resolved: true }
    })

    // Notify all users with view_exceptions permission that this exception is resolved
    notifyExceptionResolved(id, exception.type).catch(console.error)

    revalidatePath('/exceptions')
}
