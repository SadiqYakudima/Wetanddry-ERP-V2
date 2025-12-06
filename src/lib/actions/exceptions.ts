'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function getExceptions() {
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

    if (!type || !reason || isNaN(quantity)) {
        throw new Error('Invalid input')
    }

    await prisma.exceptionLog.create({
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

    revalidatePath('/exceptions')
}

export async function resolveException(id: string) {
    await prisma.exceptionLog.update({
        where: { id },
        data: { resolved: true }
    })
    revalidatePath('/exceptions')
}
