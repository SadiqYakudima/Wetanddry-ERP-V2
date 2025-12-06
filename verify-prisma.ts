import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Prisma Client models...')

    if (prisma.inventoryItem) {
        console.log('✅ prisma.inventoryItem exists')
        const count = await prisma.inventoryItem.count()
        console.log(`Count: ${count}`)
    } else {
        console.error('❌ prisma.inventoryItem is UNDEFINED')
        console.log('Available keys on prisma:', Object.keys(prisma))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
