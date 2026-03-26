import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { jsonResponse } from "./cors";

export interface JwtPayload {
  id: string;
  email: string;
  org_id: string;
  first_name: string;
  role: string;
}

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET env var");
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Extract and verify the JWT from the Authorization header.
 * Returns the payload if valid, or a 401 Response if not.
 */
export function authenticateRequest(
  req: Request
): JwtPayload | Response {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    return verifyToken(token);
  } catch {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }
}
