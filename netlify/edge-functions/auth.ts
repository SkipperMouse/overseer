import type { Context } from "@netlify/edge-functions";

export default async function auth(request: Request, context: Context) {
  const password = Netlify.env.get("AUTH_PASSWORD");

  if (!password) {
    return context.next();
  }

  const authHeader = request.headers.get("Authorization");

  if (authHeader) {
    const expected = "Basic " + btoa(`overseer:${password}`);
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
