import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  findSession,
  findUserByEmail,
  verifyPassword,
} from "@/lib/db";

const sessionCookieName = "threebeeez_session";

export async function signIn(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = findUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { success: false as const, message: "Invalid email or password." };
  }

  const session = createSession(user.id);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });

  return { success: true as const, user };
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    deleteSession(token);
  }

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = findSession(token);

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt) <= new Date()) {
    deleteSession(token);
    return null;
  }

  return session;
}

export async function requireOwner() {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    redirect("/login");
  }

  return user;
}

export async function requireClientPortalUser() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "client_admin" && user.role !== "owner")) {
    redirect("/login");
  }

  return user;
}
