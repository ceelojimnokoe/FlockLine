import "server-only";
import { headers } from "next/headers";

/**
 * Resolves the app's origin for building absolute redirect URLs (e.g. magic
 * link callbacks) from inside a Server Action, where there is no `request`
 * object to read `request.url` from.
 */
export async function getOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}
