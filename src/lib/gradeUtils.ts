import { settingsService, GradeRangesConfig } from './firestore';

/**
 * Unified grade calculation utilities to ensure consistency across all grade-related pages
 */

export interface LetterGradeResult {
  letter: string;
  points: number;
}

/**
 * Get default grade ranges if not provided
 */
export const getDefaultGradeRanges = (): GradeRangesConfig => ({
          'A+': { min: 95, max: 100, points: 4.0 },
          'A': { min: 85, max: 94.9, points: 4.0 },
          'A-': { min: 80, max: 84.9, points: 3.75 },
          'B+': { min: 75, max: 79.9, points: 3.5 },
          'B': { min: 70, max: 74.9, points: 3.0 },
          'B-': { min: 60, max: 69.9, points: 2.75 },
          'C+': { min: 55, max: 59.9, points: 2 },
          'C': { min: 50, max: 54.9, points: 1.5 },
          'D': { min: 40, max: 49.9, points: 1.0 },
          'F': { min: 0, max: 39.9, points: 0.0 },
});
/**
 * Calculate letter grade and grade points from percentage
 * @param points - Total points earned
 * @param maxPoints - Maximum possible points
 * @param gradeRanges - Grade ranges configuration (optional, uses defaults if not provided)
 * @returns Letter grade and grade points
 */
export const calculateLetterGrade = (
  points: number, 
  maxPoints: number, 
  gradeRanges?: GradeRangesConfig
): LetterGradeResult => {
  // Handle edge cases
  if (maxPoints <= 0) {
    return { letter: 'F', points: 0.0 };
  }

  // Calculate percentage, if maxPoints is 100, points is already a percentage
  const percentage = maxPoints === 100 ? points : Math.round((points / maxPoints) * 100);

  // Use provided ranges or defaults
  const ranges = gradeRanges || getDefaultGradeRanges();

  // Sort ranges by min value in descending order to check from highest to lowest
  const sortedRanges = Object.entries(ranges).sort(([, a], [, b]) => b.min - a.min);

  // Find matching grade range
  for (const [letter, range] of sortedRanges) {
    if (percentage >= range.min && percentage <= range.max) {
      return { letter, points: range.points };
    }
  }

  // Default to F if no range matches
  return { letter: 'F', points: 0.0 };
};

/**
 * Calculate GPA from an array of grade points
 * @param gradePoints - Array of grade point values
 * @param includeUnpublished - Whether to include unpublished grades
 * @returns Calculated GPA (0-4.0 scale)
 */
export const calculateGPA = (gradePoints: number[], includeUnpublished = false): number => {
  // Filter out invalid values
  const validPoints = gradePoints.filter(p => !isNaN(p) && p >= 0);

  if (validPoints.length === 0) {
    return 0;
  }

  // Calculate average
  const sum = validPoints.reduce((acc, points) => acc + points, 0);
  const average = sum / validPoints.length;

  // Round to 2 decimal places and ensure within 0-4.0 range
  return Math.min(4.0, Math.max(0, Math.round(average * 100) / 100));
};

/**
 * Format GPA for display
 * @param gpa - GPA value
 * @returns Formatted GPA string
 */
export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

/**
 * Calculate percentage from points
 * @param points - Points earned
 * @param maxPoints - Maximum possible points
 * @returns Percentage (0-100)
 */
export const calculatePercentage = (points: number, maxPoints: number): number => {
  if (maxPoints <= 0) return 0;
  return Math.round((points / maxPoints) * 100);
};

/**
 * Get grade color class based on letter grade
 * @param letterGrade - Letter grade (A, B, C, D, F)
 * @returns Tailwind color class
 */
export const getGradeColorClass = (letterGrade: string): string => {
  switch (letterGrade[0]) {
    case 'A':
      return 'text-green-600';
    case 'B':
      return 'text-blue-600';
    case 'C':
      return 'text-yellow-600';
    case 'D':
      return 'text-orange-600';
    case 'F':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

/**
 * Get grade badge variant based on letter grade
 * @param letterGrade - Letter grade
 * @returns Badge variant
 */
export const getGradeBadgeVariant = (letterGrade: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (letterGrade[0]) {
    case 'A':
      return 'default';
    case 'B':
      return 'secondary';
    case 'C':
      return 'outline';
    case 'D':
    case 'F':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Load grade ranges with fallback to defaults
 */
export const loadGradeRanges = async (): Promise<GradeRangesConfig> => {
  try {
    return await settingsService.getGradeRanges();
  } catch (error) {
    console.error('Failed to load grade ranges, using defaults:', error);
    return getDefaultGradeRanges();
  }
};