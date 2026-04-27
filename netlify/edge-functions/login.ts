export default async function login(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { username, password } = body
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'missing credentials' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const expectedUser = Netlify.env.get('AUTH_USERNAME') ?? 'overseer'
  const expectedPass = Netlify.env.get('AUTH_PASSWORD')

  if (!expectedPass || username !== expectedUser || password !== expectedPass) {
    return new Response(JSON.stringify({ error: 'invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionValue = btoa(`${username}:${password}`)
  const maxAge = 60 * 60 * 24 * 7 // 7 days

  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', `overseer_session=${sessionValue}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`)
  headers.append('Set-Cookie', `overseer_ui=1; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`)

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
