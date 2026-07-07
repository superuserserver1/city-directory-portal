/**
 * Input Validation Helpers
 * Provides sanitization and validation utilities for all API endpoints.
 */

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon',
  '123123', 'baseball', 'abc123', 'football', 'monkey',
  'letmein', 'shadow', 'master', '666666', 'qwertyuiop',
  '123321', 'mustang', '1234567890', 'michael', '654321',
  'pussy', 'superman', 'qazwsx', '!@#$%^&*', 'password1',
  'password123', 'admin', 'admin123', 'root', 'welcome',
  'pass', 'pass123', 'test', 'test123', 'guest',
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordStrengthResult {
  valid: boolean;
  strength: number; // 0-4 (0 = too weak, 4 = very strong)
  error?: string;
}

/**
 * Validates an email address using a proper regex pattern.
 */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  const trimmed = email.trim().toLowerCase();
  // RFC 5322 compliant (simplified) email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validates password strength. Minimum 6 characters, rejects common passwords.
 * Returns a strength score from 0-4.
 */
export function validatePassword(password: unknown): PasswordStrengthResult {
  if (typeof password !== 'string') {
    return { valid: false, strength: 0, error: 'Password must be a string' };
  }
  if (password.length < 6) {
    return { valid: false, strength: 0, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, strength: 0, error: 'Password is too long' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, strength: 0, error: 'Password is too common. Please choose a stronger password.' };
  }

  // Calculate strength score (0-4)
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  // Cap at 4
  strength = Math.min(strength, 4);

  return { valid: true, strength };
}

/**
 * Sanitizes a string by stripping HTML tags, trimming whitespace, and limiting length.
 */
export function sanitizeString(str: unknown, maxLength: number = 1000): string {
  if (typeof str !== 'string') return '';
  // Strip HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

/**
 * Validates a phone number with basic format check.
 * Accepts optional strings - returns valid: true for empty/null.
 */
export function validatePhone(phone: unknown): ValidationResult {
  if (phone === undefined || phone === null || phone === '') {
    return { valid: true }; // Phone is optional
  }
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a string' };
  }
  const trimmed = phone.trim();
  // Allow common phone formats: +XX-XXXXXXXXXX, +XX XXXXXXXXXX, 0XXXXXXXXXX, etc.
  const phoneRegex = /^[\d\s\-+().]{7,20}$/;
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  return { valid: true };
}

/**
 * Validates that a name string meets minimum requirements.
 */
export function validateName(name: unknown): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be at most 100 characters' };
  }
  return { valid: true };
}

/**
 * Generates a random request ID for error tracking.
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

/**
 * Creates a safe error response object that never leaks internal details.
 */
export function safeErrorResponse(requestId: string): { error: string; requestId: string } {
  return {
    error: 'Internal server error',
    requestId,
  };
}

/**
 * Checks if an error is a Prisma "not found" error (P2025).
 * Used to return proper 404 without leaking error codes.
 */
export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'P2025'
  );
}

/**
 * Checks if an error is a Prisma "unique constraint" error (P2002).
 * Used to return proper 409 without leaking error codes.
 */
export function isPrismaUniqueError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}