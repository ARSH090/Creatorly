import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })
    const res = await fetch(url, { method: 'GET' })
    const html = await res.text()
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    const linkMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
    const imageUrl = ogMatch?.[1] || twitterMatch?.[1] || linkMatch?.[1] || null
    if (!imageUrl) return NextResponse.json({ thumbnail: null })
    return NextResponse.json({ thumbnail: imageUrl })
  } catch {
    return NextResponse.json({ thumbnail: null })
  }
}
