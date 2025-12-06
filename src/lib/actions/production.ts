'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function getRecipes() {
    return await prisma.recipe.findMany({
        include: { ingredients: true }
    })
}

export async function createProductionRun(formData: FormData) {
    const recipeId = formData.get('recipeId') as string
    const quantity = parseFloat(formData.get('quantity') as string)

    if (!recipeId || isNaN(quantity) || quantity <= 0) {
        throw new Error('Invalid input')
    }

    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { ingredients: true }
    })

    if (!recipe) throw new Error('Recipe not found')

    // Transaction: Deduct stock and record production
    await prisma.$transaction(async (tx) => {
        // 1. Check and Deduct Stock for each ingredient
        for (const ingredient of recipe.ingredients) {
            const requiredAmount = ingredient.quantity * quantity

            // Find available inventory items matching the material name
            // Logic: FIFO or take from largest pile. Here: Take from first available with enough stock.
            const inventoryItems = await tx.inventoryItem.findMany({
                where: { name: ingredient.materialName },
                orderBy: { quantity: 'desc' } // Take from largest pile first
            })

            let remaining = requiredAmount

            for (const item of inventoryItems) {
                if (remaining <= 0) break

                const take = Math.min(item.quantity, remaining)

                await tx.inventoryItem.update({
                    where: { id: item.id },
                    data: { quantity: { decrement: take } }
                })

                // Record the deduction (Stock OUT)
                await tx.stockTransaction.create({
                    data: {
                        itemId: item.id,
                        type: 'OUT',
                        quantity: take,
                        reason: `Production: ${recipe.name} (Run ID pending)`,
                        status: 'Approved'
                    }
                })

                remaining -= take
            }

            if (remaining > 0) {
                throw new Error(`Insufficient stock for ${ingredient.materialName}. Missing ${remaining} ${ingredient.unit}.`)
            }
        }

        // 2. Create Production Run Record
        await tx.productionRun.create({
            data: {
                recipeId,
                quantity,
                status: 'Completed'
            }
        })
    })

    revalidatePath('/production')
    revalidatePath('/inventory')
}

// Seed initial recipes
export async function seedRecipes() {
    const count = await prisma.recipe.count()
    if (count === 0) {
        await prisma.recipe.create({
            data: {
                name: 'Standard Concrete (C25)',
                description: 'General purpose concrete mix',
                ingredients: {
                    create: [
                        { materialName: 'Portland Cement (Grade 42.5)', quantity: 300, unit: 'kg' }, // 300kg per m3
                        { materialName: 'Sika ViscoCrete', quantity: 2.5, unit: 'liters' } // 2.5L per m3
                    ]
                }
            }
        })
    }
}
