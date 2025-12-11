import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

/**
 * Prisma Client Configuration
 * 
 * Uses Neon serverless driver when DATABASE_URL contains 'neon'
 */

declare global {
    var prismaGlobal: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
    const databaseUrl = process.env.DATABASE_URL

    // Use Neon adapter for Neon PostgreSQL
    if (databaseUrl?.includes('neon')) {
        const adapter = new PrismaNeon({ connectionString: databaseUrl })
        return new PrismaClient({ adapter })
    }

    // Fallback to standard Prisma client
    return new PrismaClient()
}

// Create new client each time in serverless environments
// to avoid connection pooling issues
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
    prisma = createPrismaClient()
} else {
    // In development, reuse the client across hot reloads
    if (!globalThis.prismaGlobal) {
        globalThis.prismaGlobal = createPrismaClient()
    }
    prisma = globalThis.prismaGlobal
}

export default prisma
