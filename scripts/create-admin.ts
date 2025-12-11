// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@wetndry.com' },
        update: {},
        create: {
            email: 'admin@wetndry.com',
            name: 'Admin',
            password: hashedPassword,
            role: 'Super Admin',
        },
    })

    console.log('Created admin user:', user.email)
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
