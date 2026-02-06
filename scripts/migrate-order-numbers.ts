// Script to migrate existing order numbers from ORD-YYYYMM-XXX format to SO-YYYY-XXXXX format
// Run with: npx ts-node scripts/migrate-order-numbers.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateOrderNumbers() {
    console.log('Starting order number migration...')

    // Get all orders with old format (ORD-XXXXXX-XXX)
    const orders = await prisma.salesOrder.findMany({
        where: {
            orderNumber: {
                startsWith: 'ORD-'
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    console.log(`Found ${orders.length} orders to migrate`)

    // Group orders by year
    const ordersByYear: Record<number, typeof orders> = {}

    for (const order of orders) {
        // Extract year from the old order number (ORD-YYYYMM-XXX)
        const match = order.orderNumber.match(/ORD-(\d{4})/)
        const year = match ? parseInt(match[1]) : new Date(order.createdAt).getFullYear()

        if (!ordersByYear[year]) {
            ordersByYear[year] = []
        }
        ordersByYear[year].push(order)
    }

    // Calculate next numbers for each year
    let totalMigrated = 0

    for (const [year, yearOrders] of Object.entries(ordersByYear)) {
        // Check existing SO numbers for this year
        const existingSO = await prisma.salesOrder.findFirst({
            where: {
                orderNumber: { startsWith: `SO-${year}-` }
            },
            orderBy: { orderNumber: 'desc' }
        })

        let nextNumber = 1
        if (existingSO) {
            const lastNum = parseInt(existingSO.orderNumber.split('-').pop() || '0')
            nextNumber = lastNum + 1
        }

        // Update each order
        for (const order of yearOrders) {
            const newNumber = `SO-${year}-${String(nextNumber).padStart(5, '0')}`

            await prisma.salesOrder.update({
                where: { id: order.id },
                data: { orderNumber: newNumber }
            })

            console.log(`Migrated: ${order.orderNumber} -> ${newNumber}`)
            nextNumber++
            totalMigrated++
        }
    }

    console.log(`\nMigration complete! ${totalMigrated} orders updated.`)
}

migrateOrderNumbers()
    .catch((e) => {
        console.error('Migration failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
