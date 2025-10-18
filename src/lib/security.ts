/**
 * Security utilities for input validation and sanitization
 */

// HTML entities to prevent XSS
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize user input by removing potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limit length to prevent DoS
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; message?: string } {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, message: 'File size must be less than 10MB' };
  }
  
  // Check allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: 'File type not allowed' };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp)$/i;
  if (suspiciousPatterns.test(file.name)) {
    return { valid: false, message: 'File type not allowed' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 60000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy helper
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}