import type { Context } from "@netlify/edge-functions";

const STATIC_EXTENSIONS = /\.(png|jpg|jpeg|svg|webp|ico|woff2|js|css|webmanifest)(\?.*)?$/i

export default async function auth(request: Request, context: Context) {
  if (STATIC_EXTENSIONS.test(new URL(request.url).pathname)) {
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
