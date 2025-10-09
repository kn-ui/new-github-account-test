import { hygraphClient } from '../config/hygraph';
import {
  GET_GRADES,
  CREATE_GRADE,
  UPDATE_GRADE
} from '../lib/hygraphOperations';
import { hygraphAssignmentService } from './hygraphAssignmentService';
import { hygraphExamService } from './hygraphExamService';

// Types for Hygraph data
export interface HygraphGrade {
  id: string;
  finalGrade: number;
  letterGrade: string;
  gradePoints: number;
  calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
  assignmentGrades?: any; // JSON
  notes?: string;
  calculatedBy: string;
  calculatedAt: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface CreateGradeData {
  studentId: string;
  courseId: string;
  finalGrade: number;
  letterGrade: string;
  gradePoints: number;
  calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
  assignmentGrades?: any;
  notes?: string;
  calculatedBy: string;
}

export interface UpdateGradeData {
  finalGrade?: number;
  letterGrade?: string;
  gradePoints?: number;
  calculationMethod?: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
  assignmentGrades?: any;
  notes?: string;
}

export interface GradeCalculationData {
  assignmentGrades: { [assignmentId: string]: number };
  examGrades: { [examId: string]: number };
  assignmentWeight: number; // Percentage (0-100)
  examWeight: number; // Percentage (0-100)
  participationGrade?: number;
  participationWeight?: number; // Percentage (0-100)
  calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
}

// Grade calculation utilities
export class GradeCalculator {
  // Convert numeric grade to letter grade
  static numericToLetter(grade: number): string {
    if (grade >= 97) return 'A+';
    if (grade >= 93) return 'A';
    if (grade >= 90) return 'A-';
    if (grade >= 87) return 'B+';
    if (grade >= 83) return 'B';
    if (grade >= 80) return 'B-';
    if (grade >= 77) return 'C+';
    if (grade >= 73) return 'C';
    if (grade >= 70) return 'C-';
    if (grade >= 67) return 'D+';
    if (grade >= 63) return 'D';
    if (grade >= 60) return 'D-';
    return 'F';
  }

  // Convert letter grade to grade points (4.0 scale)
  static letterToGradePoints(letterGrade: string): number {
    const gradeMap: { [key: string]: number } = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[letterGrade] || 0.0;
  }

  // Calculate weighted average grade
  static calculateWeightedAverage(data: GradeCalculationData): number {
    let totalWeight = 0;
    let weightedSum = 0;

    // Calculate assignment average
    const assignmentGrades = Object.values(data.assignmentGrades);
    if (assignmentGrades.length > 0 && data.assignmentWeight > 0) {
      const assignmentAverage = assignmentGrades.reduce((sum, grade) => sum + grade, 0) / assignmentGrades.length;
      weightedSum += assignmentAverage * (data.assignmentWeight / 100);
      totalWeight += data.assignmentWeight;
    }

    // Calculate exam average
    const examGrades = Object.values(data.examGrades);
    if (examGrades.length > 0 && data.examWeight > 0) {
      const examAverage = examGrades.reduce((sum, grade) => sum + grade, 0) / examGrades.length;
      weightedSum += examAverage * (data.examWeight / 100);
      totalWeight += data.examWeight;
    }

    // Add participation grade if provided
    if (data.participationGrade !== undefined && data.participationWeight && data.participationWeight > 0) {
      weightedSum += data.participationGrade * (data.participationWeight / 100);
      totalWeight += data.participationWeight;
    }

    // Return weighted average or 0 if no grades
    return totalWeight > 0 ? weightedSum / (totalWeight / 100) : 0;
  }

  // Calculate simple average grade
  static calculateSimpleAverage(data: GradeCalculationData): number {
    const allGrades = [
      ...Object.values(data.assignmentGrades),
      ...Object.values(data.examGrades)
    ];

    if (data.participationGrade !== undefined) {
      allGrades.push(data.participationGrade);
    }

    if (allGrades.length === 0) return 0;

    return allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length;
  }
}

// Hygraph Grade Service for Backend
export const hygraphGradeService = {
  // ===== GRADE OPERATIONS =====
  
  // Get all grades with pagination
  async getGrades(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphGrade[]> {
    try {
      const response = await hygraphClient.request(GET_GRADES, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).grades || [];
    } catch (error) {
      console.error('Error fetching grades from Hygraph:', error);
      throw error;
    }
  },

  // Get grade by ID
  async getGradeById(id: string): Promise<HygraphGrade | null> {
    try {
      const response = await hygraphClient.request(GET_GRADES, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const grades = (response as any).grades || [];
      return grades.length > 0 ? grades[0] : null;
    } catch (error) {
      console.error('Error fetching grade by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get grades by student
  async getGradesByStudent(studentId: string, limit: number = 100): Promise<HygraphGrade[]> {
    try {
      const response = await hygraphClient.request(GET_GRADES, {
        first: limit,
        skip: 0,
        where: { student: { id: studentId } }
      });
      return (response as any).grades || [];
    } catch (error) {
      console.error('Error fetching grades by student from Hygraph:', error);
      throw error;
    }
  },

  // Get grades by course
  async getGradesByCourse(courseId: string, limit: number = 100): Promise<HygraphGrade[]> {
    try {
      const response = await hygraphClient.request(GET_GRADES, {
        first: limit,
        skip: 0,
        where: { course: { id: courseId } }
      });
      return (response as any).grades || [];
    } catch (error) {
      console.error('Error fetching grades by course from Hygraph:', error);
      throw error;
    }
  },

  // Get student's grade for specific course
  async getStudentCourseGrade(studentId: string, courseId: string): Promise<HygraphGrade | null> {
    try {
      const response = await hygraphClient.request(GET_GRADES, {
        first: 1,
        skip: 0,
        where: { 
          student: { id: studentId },
          course: { id: courseId }
        }
      });
      const grades = (response as any).grades || [];
      return grades.length > 0 ? grades[0] : null;
    } catch (error) {
      console.error('Error fetching student course grade from Hygraph:', error);
      throw error;
    }
  },

  // Create new grade
  async createGrade(gradeData: CreateGradeData): Promise<HygraphGrade> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_GRADE, {
        data: {
          finalGrade: gradeData.finalGrade,
          letterGrade: gradeData.letterGrade,
          gradePoints: gradeData.gradePoints,
          calculationMethod: gradeData.calculationMethod,
          assignmentGrades: gradeData.assignmentGrades,
          notes: gradeData.notes,
          calculatedBy: gradeData.calculatedBy,
          calculatedAt: now,
          student: { connect: { id: gradeData.studentId } },
          course: { connect: { id: gradeData.courseId } }
        }
      });
      return (response as any).createGrade;
    } catch (error) {
      console.error('Error creating grade in Hygraph:', error);
      throw error;
    }
  },

  // Update grade
  async updateGrade(id: string, gradeData: UpdateGradeData): Promise<HygraphGrade> {
    try {
      const response = await hygraphClient.request(UPDATE_GRADE, {
        id,
        data: {
          ...gradeData,
          calculatedAt: new Date().toISOString()
        }
      });
      return (response as any).updateGrade;
    } catch (error) {
      console.error('Error updating grade in Hygraph:', error);
      throw error;
    }
  },

  // ===== GRADE CALCULATION =====

  // Calculate and create grade for student in course
  async calculateAndCreateGrade(
    studentId: string, 
    courseId: string, 
    calculationData: GradeCalculationData,
    calculatedBy: string,
    notes?: string
  ): Promise<HygraphGrade> {
    try {
      // Calculate final grade based on method
      let finalGrade: number;
      if (calculationData.calculationMethod === 'WEIGHTED_AVERAGE') {
        finalGrade = GradeCalculator.calculateWeightedAverage(calculationData);
      } else if (calculationData.calculationMethod === 'SIMPLE_AVERAGE') {
        finalGrade = GradeCalculator.calculateSimpleAverage(calculationData);
      } else {
        throw new Error('Invalid calculation method');
      }

      // Convert to letter grade and grade points
      const letterGrade = GradeCalculator.numericToLetter(finalGrade);
      const gradePoints = GradeCalculator.letterToGradePoints(letterGrade);

      // Check if grade already exists
      const existingGrade = await this.getStudentCourseGrade(studentId, courseId);
      if (existingGrade) {
        // Update existing grade
        return await this.updateGrade(existingGrade.id, {
          finalGrade,
          letterGrade,
          gradePoints,
          assignmentGrades: calculationData.assignmentGrades,
          notes
        });
      } else {
        // Create new grade
        return await this.createGrade({
          studentId,
          courseId,
          finalGrade,
          letterGrade,
          gradePoints,
          calculationMethod: calculationData.calculationMethod,
          assignmentGrades: calculationData.assignmentGrades,
          notes,
          calculatedBy
        });
      }
    } catch (error) {
      console.error('Error calculating and creating grade:', error);
      throw error;
    }
  },

  // Auto-calculate grade from assignments and exams
  async autoCalculateGrade(
    studentId: string,
    courseId: string,
    assignmentWeight: number = 60,
    examWeight: number = 40,
    participationGrade?: number,
    participationWeight?: number,
    calculatedBy: string = 'system'
  ): Promise<HygraphGrade> {
    try {
      // Get student's assignment submissions
      const assignmentSubmissions = await hygraphAssignmentService.getSubmissionsByStudent(studentId, 1000);
      const courseAssignmentSubmissions = assignmentSubmissions.filter(
        s => s.course?.id === courseId && s.submissionStatus === 'GRADED'
      );

      // Get student's exam attempts
      const examAttempts = await hygraphExamService.getExamAttemptsByStudent(studentId, 1000);
      const courseExamAttempts = examAttempts.filter(
        a => a.exam?.id && a.examAttemptStatus === 'GRADED'
      );

      // Prepare calculation data
      const assignmentGrades: { [assignmentId: string]: number } = {};
      courseAssignmentSubmissions.forEach(submission => {
        if (submission.assignment?.id && submission.grade !== undefined) {
          assignmentGrades[submission.assignment.id] = submission.grade;
        }
      });

      const examGrades: { [examId: string]: number } = {};
      courseExamAttempts.forEach(attempt => {
        if (attempt.exam?.id) {
          examGrades[attempt.exam.id] = attempt.score;
        }
      });

      const calculationData: GradeCalculationData = {
        assignmentGrades,
        examGrades,
        assignmentWeight,
        examWeight,
        participationGrade,
        participationWeight,
        calculationMethod: 'WEIGHTED_AVERAGE'
      };

      return await this.calculateAndCreateGrade(
        studentId,
        courseId,
        calculationData,
        calculatedBy,
        'Auto-calculated from assignments and exams'
      );
    } catch (error) {
      console.error('Error auto-calculating grade:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get student's GPA
  async getStudentGPA(studentId: string): Promise<{
    gpa: number;
    totalCredits: number;
    totalGradePoints: number;
    grades: HygraphGrade[];
  }> {
    try {
      const grades = await this.getGradesByStudent(studentId, 1000);
      
      let totalGradePoints = 0;
      let totalCredits = 0;

      grades.forEach(grade => {
        // Assuming each course is worth 3 credits (this should be configurable)
        const credits = 3;
        totalGradePoints += grade.gradePoints * credits;
        totalCredits += credits;
      });

      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      return {
        gpa: Math.round(gpa * 100) / 100,
        totalCredits,
        totalGradePoints,
        grades
      };
    } catch (error) {
      console.error('Error calculating student GPA:', error);
      throw error;
    }
  },

  // Get course grade statistics
  async getCourseGradeStats(courseId: string): Promise<{
    totalStudents: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    gradeDistribution: { [letterGrade: string]: number };
  }> {
    try {
      const grades = await this.getGradesByCourse(courseId, 1000);
      
      if (grades.length === 0) {
        return {
          totalStudents: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          gradeDistribution: {}
        };
      }

      const finalGrades = grades.map(g => g.finalGrade);
      const averageGrade = finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length;
      const highestGrade = Math.max(...finalGrades);
      const lowestGrade = Math.min(...finalGrades);

      // Calculate grade distribution
      const gradeDistribution: { [letterGrade: string]: number } = {};
      grades.forEach(grade => {
        const letter = grade.letterGrade;
        gradeDistribution[letter] = (gradeDistribution[letter] || 0) + 1;
      });

      return {
        totalStudents: grades.length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        highestGrade,
        lowestGrade,
        gradeDistribution
      };
    } catch (error) {
      console.error('Error calculating course grade stats:', error);
      throw error;
    }
  },

  // Get teacher's grading statistics
  async getTeacherGradingStats(teacherId: string): Promise<{
    totalGrades: number;
    averageGrade: number;
    coursesGraded: number;
    recentGrades: HygraphGrade[];
  }> {
    try {
      // This would need to be implemented based on how we track which teacher graded what
      // For now, we'll get all grades and filter by recent activity
      const allGrades = await this.getGrades(1000, 0);
      const recentGrades = allGrades.slice(0, 10); // Last 10 grades

      const finalGrades = allGrades.map(g => g.finalGrade);
      const averageGrade = finalGrades.length > 0 
        ? finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length 
        : 0;

      const uniqueCourses = new Set(allGrades.map(g => g.course?.id)).size;

      return {
        totalGrades: allGrades.length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        coursesGraded: uniqueCourses,
        recentGrades
      };
    } catch (error) {
      console.error('Error calculating teacher grading stats:', error);
      throw error;
    }
  }
};