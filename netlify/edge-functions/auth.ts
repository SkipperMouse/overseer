import type { Context } from "@netlify/edge-functions";

// Public paths — resources fetched outside an authenticated Safari session:
// - /icons/* — iOS Springboard on Add to Home Screen, PWA install
// - /apple-touch-icon(-precomposed).png — iOS root probe outside the authenticated tab
// - /favicon.* — tab render before login
// - /manifest.webmanifest — PWA install flow
// Everything else (JS/CSS/WOFF2/sw.js) stays behind Basic Auth — anon key is in the JS bundle.
const PUBLIC_PATHS = /^\/(icons\/[^/]+\.(png|svg|webp)|apple-touch-icon(-precomposed)?\.png|favicon\.(svg|ico)|manifest\.webmanifest)(\?.*)?$/

export default async function auth(request: Request, context: Context) {
  if (PUBLIC_PATHS.test(new URL(request.url).pathname)) {
    return context.next()
  }

  const username = Netlify.env.get("AUTH_USERNAME") ?? "overseer";
  const password = Netlify.env.get("AUTH_PASSWORD");

  if (!password) {
    return context.next();
  }

  const authHeader = request.headers.get("Authorization");

  if (authHeader) {
    const expected = "Basic " + btoa(`${username}:${password}`);
    if (authHeader === expected) {
      return context.next();
    }
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="OVERSEER"',
    },
  });
}
