import type { Config } from "@netlify/functions";
import { ping } from "./keep-alive";
import { corsResponse } from "./utils/cors";

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return corsResponse();
  return ping();
}

export const config: Config = {
  path: "/api/keep-alive",
};
