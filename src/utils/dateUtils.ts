/**
 * Utility functions for safe date conversion
 * Handles both Date objects and Firestore Timestamps
 */

/**
 * Safely converts a value to a Date object
 * @param value - Can be a Date, Firestore Timestamp, or any value
 * @returns Date object or null if conversion fails
 */
export function toSafeDate(value: any): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) {
    return value;
  }
  
  // Check if it's a Firestore Timestamp with toDate method
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch (error) {
      console.error('Error converting timestamp to date:', error);
      return null;
    }
  }
  
  // Try to parse as string or number
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

/**
 * Formats a date value to locale date string
 * @param value - Can be a Date, Firestore Timestamp, or any value
 * @param defaultValue - Default string to return if conversion fails
 * @returns Formatted date string or default value
 */
export function formatDateString(value: any, defaultValue: string = 'N/A'): string {
  const date = toSafeDate(value);
  return date ? date.toLocaleDateString() : defaultValue;
}

/**
 * Formats a date value to locale time string
 * @param value - Can be a Date, Firestore Timestamp, or any value
 * @param defaultValue - Default string to return if conversion fails
 * @returns Formatted time string or default value
 */
export function formatTimeString(value: any, defaultValue: string = 'N/A'): string {
  const date = toSafeDate(value);
  return date ? date.toLocaleTimeString() : defaultValue;
}

/**
 * Formats a date value to locale date and time string
 * @param value - Can be a Date, Firestore Timestamp, or any value
 * @param defaultValue - Default string to return if conversion fails
 * @returns Formatted date and time string or default value
 */
export function formatDateTimeString(value: any, defaultValue: string = 'N/A'): string {
  const date = toSafeDate(value);
  return date ? date.toLocaleString() : defaultValue;
}

/**
 * Compares two date values
 * @param date1 - First date value
 * @param date2 - Second date value
 * @returns Comparison result (-1, 0, 1) or 0 if either date is invalid
 */
export function compareDates(date1: any, date2: any): number {
  const d1 = toSafeDate(date1);
  const d2 = toSafeDate(date2);
  
  if (!d1 || !d2) return 0;
  
  return d1.getTime() - d2.getTime();
}
