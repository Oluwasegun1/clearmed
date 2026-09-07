/**
 * Password Policy v2.0 Implementation for ClearMed
 * 
 * Rules:
 * 1. Minimum 8 characters.
 * 2. At least one uppercase letter (A-Z).
 * 3. At least one lowercase letter (a-z).
 * 4. At least one number (0-9).
 * 5. Rejection if found in common password / breach list.
 */

// Common breached/weak passwords list (normalized lowercase)
export const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "letmein123",
  "welcome123",
  "admin123",
  "clearmed123",
  "iloveyou123",
  "sunshine123",
  "princess123",
  "football123",
  "monkey123",
  "dragon123",
  "master123",
  "superman123",
  "trustno1",
  "00000000",
  "11111111",
  "abcdef123",
  "password1",
  "change123",
  "changeme123",
  "default123",
  "guest1234",
  "security123",
  "health123",
  "patient123",
  "doctor123",
  "hospital123",
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a password against v2.0 policy requirements.
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  // Minimum 8 characters
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z).");
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z).");
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9).");
  }

  // Common password / breach list check
  const normalizedPassword = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalizedPassword)) {
    errors.push("Password is too common or has been flagged in breach databases. Please choose a more secure password.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format using standard RFC 5322 pattern check.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
