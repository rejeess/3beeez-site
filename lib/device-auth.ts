import "server-only";
import { getDb } from "@/lib/db";

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const OTP_MAX_ATTEMPTS = 3;

export function isTrustedDevice(userId: number, fingerprint: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id FROM device_fingerprints WHERE user_id = ? AND fingerprint = ? AND revoked = 0"
    )
    .get(userId, fingerprint) as { id: number } | undefined;

  if (row) {
    db.prepare("UPDATE device_fingerprints SET last_seen_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      row.id
    );
    return true;
  }
  return false;
}

export function createDeviceVerification(userId: number, fingerprint: string): string {
  const db = getDb();
  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const now = new Date().toISOString();

  // Invalidate any pending verifications for this user+fingerprint
  db.prepare(
    "UPDATE device_verifications SET used = 1 WHERE user_id = ? AND fingerprint = ? AND used = 0"
  ).run(userId, fingerprint);

  db.prepare(
    `INSERT INTO device_verifications (user_id, fingerprint, code, attempts, expires_at, used, created_at)
     VALUES (?, ?, ?, 0, ?, 0, ?)`
  ).run(userId, fingerprint, code, expiresAt, now);

  return code;
}

export function verifyDeviceCode(
  userId: number,
  fingerprint: string,
  submittedCode: string
): { success: boolean; error?: string } {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, code, attempts, expires_at as expiresAt
       FROM device_verifications
       WHERE user_id = ? AND fingerprint = ? AND used = 0
       ORDER BY id DESC LIMIT 1`
    )
    .get(userId, fingerprint) as
    | { id: number; code: string; attempts: number; expiresAt: string }
    | undefined;

  if (!row) return { success: false, error: "Verification code not found. Please sign in again." };

  if (new Date(row.expiresAt) <= new Date()) {
    db.prepare("UPDATE device_verifications SET used = 1 WHERE id = ?").run(row.id);
    return { success: false, error: "Verification code expired. Please sign in again." };
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    db.prepare("UPDATE device_verifications SET used = 1 WHERE id = ?").run(row.id);
    return { success: false, error: "Too many incorrect attempts. Please sign in again." };
  }

  if (row.code !== submittedCode.trim()) {
    db.prepare("UPDATE device_verifications SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    const remaining = OTP_MAX_ATTEMPTS - (row.attempts + 1);
    return {
      success: false,
      error: remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
        : "Too many incorrect attempts. Please sign in again.",
    };
  }

  db.prepare("UPDATE device_verifications SET used = 1 WHERE id = ?").run(row.id);
  return { success: true };
}

export function trustDevice(userId: number, fingerprint: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO device_fingerprints (user_id, fingerprint, trusted_at, last_seen_at, revoked)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(user_id, fingerprint) DO UPDATE SET
       revoked = 0, trusted_at = excluded.trusted_at, last_seen_at = excluded.last_seen_at`
  ).run(userId, fingerprint, now, now);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}
