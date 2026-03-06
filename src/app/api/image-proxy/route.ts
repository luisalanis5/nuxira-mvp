import { NextResponse } from 'next/server';

/**
 * Proxy de imágenes para sortear restricciones CORS de Google Photos, Instagram CDN, etc.
 * Uso: /api/image-proxy?url=https://lh3.googleusercontent.com/...
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NuxiraBot/1.0)',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://www.google.com/',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('[IMAGE PROXY ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
