import { timingSafeEqual } from "node:crypto";
import { allowedUsernames, type AuthUser } from "@workspace/shared";

type AllowedUsername = (typeof allowedUsernames)[number];

const allowedUsernameSet = new Set<string>(allowedUsernames);

function normalizeUsername(username: string): AllowedUsername | null {
  const normalized = username.trim().toLowerCase();
  return allowedUsernameSet.has(normalized) ? (normalized as AllowedUsername) : null;
}

function isPasswordMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function authenticateUser(username: string, password: string): AuthUser | null {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const passwordEnvName = `USER_${normalizedUsername.toUpperCase()}_PASSWORD`;
  const expectedPassword = process.env[passwordEnvName];
  if (!expectedPassword || !isPasswordMatch(password, expectedPassword)) {
    return null;
  }

  return {
    username: normalizedUsername,
    role: normalizedUsername === "admin" ? "admin" : "rep",
  };
}
