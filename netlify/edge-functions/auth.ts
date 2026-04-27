import type { Context } from "@netlify/edge-functions";

// Public paths that bypass auth so the React app can bootstrap and show LoginScreen.
// The empty alternative matches "/" so the SPA root always loads.
const PUBLIC_PATHS = /^\/(|index\.html|api\/login|assets\/[^/?]+|icons\/[^/?]+|apple-touch-icon(-precomposed)?\.png|favicon\.(svg|ico)|manifest\.webmanifest|sw\.js)(\?.*)?$/

export default async function auth(request: Request, context: Context) {
  if (PUBLIC_PATHS.test(new URL(request.url).pathname)) {
    return context.next()
  }

  const username = Netlify.env.get("AUTH_USERNAME") ?? "overseer";
  const password = Netlify.env.get("AUTH_PASSWORD");

  if (!password) {
    return context.next();
  }

  // Cookie-based session (set by /api/login)
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const sessionCookie = cookieHeader.split(";").map(c => c.trim()).find(c => c.startsWith("overseer_session="))
  if (sessionCookie) {
    const value = sessionCookie.slice("overseer_session=".length)
    const expected = btoa(`${username}:${password}`)
    if (value === expected) {
      return context.next()
    }
  }

  // HTTP Basic Auth (legacy / backward compat)
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const expected = "Basic " + btoa(`${username}:${password}`);
    if (authHeader === expected) {
      return context.next();
    }
  }

  // Redirect to root so React LoginScreen renders instead of browser dialog
  return Response.redirect(new URL("/", request.url), 302)
}
