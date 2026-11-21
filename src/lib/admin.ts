import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "radar_admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function getDigest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function hasAdminToken(): boolean {
  return Boolean(process.env.ADMIN_TOKEN);
}

/** Compares in constant time, so the token cannot be guessed character by character from response timing. */
export function getIsAdminToken(candidate: string): boolean {
  const token = process.env.ADMIN_TOKEN;
  return Boolean(token) && timingSafeEqual(getDigest(candidate), getDigest(token ?? ""));
}

export async function getIsAdmin(): Promise<boolean> {
  const sessionToken = (await cookies()).get(ADMIN_COOKIE)?.value;
  return sessionToken !== undefined && getIsAdminToken(sessionToken);
}
