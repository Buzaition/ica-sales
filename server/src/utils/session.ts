import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthUserSchema, type AuthUser } from "@workspace/shared";

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-ica_session" : "ica_session";

type SessionPayload = AuthUser & {
  exp: number;
};

type CookieRequest = {
  headers?: {
    cookie?: string | string[];
  };
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge?: number;
  path: string;
};

type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): unknown;
  clearCookie(name: string, options: Omit<CookieOptions, "maxAge">): unknown;
};

type RequestWithAuthUser = {
  authUser?: AuthUser;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required but not set.");
  }
  return secret;
}

export function assertSessionSecret(): void {
  getSessionSecret();
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

export function createSessionToken(user: AuthUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined): AuthUser | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !constantTimeEqual(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }

    const parsed = AuthUserSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function getSessionTokenFromRequest(req: unknown): string | undefined {
  const cookieHeader = (req as CookieRequest).headers?.cookie;
  const cookies = parseCookies(Array.isArray(cookieHeader) ? cookieHeader.join(";") : cookieHeader);
  return cookies[SESSION_COOKIE_NAME];
}

export function readSession(req: unknown): AuthUser | null {
  const token = getSessionTokenFromRequest(req);
  return verifySessionToken(token);
}

export function getRequestAuthUser(req: unknown): AuthUser | undefined {
  return (req as RequestWithAuthUser).authUser;
}

export function setRequestAuthUser(req: unknown, user: AuthUser | undefined): void {
  (req as RequestWithAuthUser).authUser = user;
}

export function setSessionCookie(res: unknown, user: AuthUser): void {
  (res as CookieResponse).cookie(SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: unknown): void {
  (res as CookieResponse).clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
