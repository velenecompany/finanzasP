import { cookies } from "next/headers";
import { signSession, verifySession, type SessionPayload } from "./jwt";

const COOKIE = "wf_session";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE = COOKIE;
