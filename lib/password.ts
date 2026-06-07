export type PasswordError = string | null;

export function validatePasswordStrength(password: string): PasswordError {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(password))
    return "Password must contain at least one number or symbol.";
  return null;
}

export function passwordStrengthHint() {
  return "Min 8 characters, with uppercase, lowercase, and a number or symbol.";
}
