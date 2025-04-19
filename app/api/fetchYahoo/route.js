export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing URL', { status: 400 })
  }

  try {
    const res = await fetch(targetUrl, { cache: 'no-store' }) // key fix
    const html = await res.text()
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (err) {
    return new Response('Failed to fetch target URL', { status: 500 })
  }
}
