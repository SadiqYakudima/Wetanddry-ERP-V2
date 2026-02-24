import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

// Ensure Cloudinary is configured
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Verify user is authenticated
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Look up document in both tables
    let doc: { url: string; name: string; cloudinaryPublicId: string } | null =
        await prisma.truckDocument.findUnique({
            where: { id },
            select: { url: true, name: true, cloudinaryPublicId: true },
        })

    if (!doc) {
        doc = await prisma.staffDocument.findUnique({
            where: { id },
            select: { url: true, name: true, cloudinaryPublicId: true },
        })
    }

    if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const debug = request.nextUrl.searchParams.get('debug') === '1'
    const attempts: { url: string; status: number; type: string }[] = []

    // Try multiple approaches to fetch the document
    const resourceTypes: Array<'image' | 'raw'> = doc.url.includes('/raw/upload/')
        ? ['raw', 'image']
        : ['image', 'raw']

    for (const resourceType of resourceTypes) {
        // Try signed URL
        const signedUrl = cloudinary.url(doc.cloudinaryPublicId, {
            secure: true,
            resource_type: resourceType,
            sign_url: true,
            type: 'upload',
        })

        try {
            const response = await fetch(signedUrl)
            attempts.push({ url: signedUrl, status: response.status, type: `signed-${resourceType}` })

            if (response.ok) {
                const contentType = response.headers.get('content-type') || 'application/octet-stream'
                const buffer = await response.arrayBuffer()
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `inline; filename="${doc.name}"`,
                        'Cache-Control': 'private, max-age=3600',
                    },
                })
            }
        } catch (e) {
            attempts.push({ url: signedUrl, status: 0, type: `signed-${resourceType}-error` })
        }

        // Try unsigned URL
        const unsignedUrl = cloudinary.url(doc.cloudinaryPublicId, {
            secure: true,
            resource_type: resourceType,
            type: 'upload',
        })

        try {
            const response = await fetch(unsignedUrl)
            attempts.push({ url: unsignedUrl, status: response.status, type: `unsigned-${resourceType}` })

            if (response.ok) {
                const contentType = response.headers.get('content-type') || 'application/octet-stream'
                const buffer = await response.arrayBuffer()
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `inline; filename="${doc.name}"`,
                        'Cache-Control': 'private, max-age=3600',
                    },
                })
            }
        } catch (e) {
            attempts.push({ url: unsignedUrl, status: 0, type: `unsigned-${resourceType}-error` })
        }
    }

    // Try the stored URL directly as last resort
    try {
        const response = await fetch(doc.url)
        attempts.push({ url: doc.url, status: response.status, type: 'stored-url' })

        if (response.ok) {
            const contentType = response.headers.get('content-type') || 'application/octet-stream'
            const buffer = await response.arrayBuffer()
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `inline; filename="${doc.name}"`,
                    'Cache-Control': 'private, max-age=3600',
                },
            })
        }
    } catch (e) {
        attempts.push({ url: doc.url, status: 0, type: 'stored-url-error' })
    }

    // Return debug info if requested, otherwise generic error
    if (debug) {
        return NextResponse.json({
            error: 'All fetch attempts failed',
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            publicId: doc.cloudinaryPublicId,
            storedUrl: doc.url,
            attempts,
        }, { status: 502 })
    }

    return NextResponse.json(
        { error: 'Failed to fetch document from storage. The file may need to be re-uploaded.' },
        { status: 502 }
    )
}
