import type { Context } from "@netlify/edge-functions";

// Публичные пути — ресурсы, которые тянутся вне авторизованной сессии Safari:
// - /icons/* — Springboard iOS при Add to Home Screen, PWA install
// - /favicon.* — рендер вкладки до логина
// - /manifest.webmanifest — PWA install flow
// Всё остальное (JS/CSS/WOFF2/sw.js) остаётся под Basic Auth — в JS-бандле anon key.
const PUBLIC_PATHS = /^\/(icons\/[^/]+\.(png|svg|webp)|favicon\.(svg|ico)|manifest\.webmanifest)(\?.*)?$/

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
