import { corsResponse, jsonResponse } from "./utils/cors";

/**
 * Unauthenticated app configuration — lets a shipped iOS build be
 * force-updated (or shown a notice) without waiting on App Store review.
 * Values are deliberately hardcoded constants for now; bump MIN_VERSION to
 * lock out builds older than it, set MESSAGE to show a banner in the app.
 */

const MIN_VERSION = "1.0.0";
const MESSAGE: string | null = null;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return jsonResponse({ min_version: MIN_VERSION, message: MESSAGE });
};
