// scripts/check-user.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log('Users in database:', users.length)
    users.forEach(u => {
        console.log(`- ${u.email} | Role: ${u.role} | Has password: ${!!u.password}`)
    })
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
