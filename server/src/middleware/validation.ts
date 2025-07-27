import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

// Validation helper functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

// Validate user registration data
export const validateUserRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, displayName, role } = req.body;

  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!displayName || displayName.trim().length < 2) {
    errors.push('Display name must be at least 2 characters long');
  }

  if (role && !isValidRole(role)) {
    errors.push('Invalid role specified');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validate course creation data
export const validateCourseCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, syllabus, category, duration, maxStudents } = req.body;

  const errors: string[] = [];

  if (!title || title.trim().length < 3) {
    errors.push('Course title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Course description must be at least 10 characters long');
  }

  if (!syllabus || syllabus.trim().length < 10) {
    errors.push('Course syllabus must be at least 10 characters long');
  }

  if (!category || category.trim().length < 2) {
    errors.push('Course category is required');
  }

  if (duration && (isNaN(duration) || duration < 1 || duration > 52)) {
    errors.push('Duration must be between 1 and 52 weeks');
  }

  if (maxStudents && (isNaN(maxStudents) || maxStudents < 1 || maxStudents > 500)) {
    errors.push('Max students must be between 1 and 500');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validate lesson creation data
export const validateLessonCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, content, order } = req.body;

  const errors: string[] = [];

  if (!title || title.trim().length < 3) {
    errors.push('Lesson title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Lesson description must be at least 10 characters long');
  }

  if (!content || content.trim().length < 10) {
    errors.push('Lesson content must be at least 10 characters long');
  }

  if (order !== undefined && (isNaN(order) || order < 1)) {
    errors.push('Lesson order must be a positive number');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validate assignment creation data
export const validateAssignmentCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, instructions, dueDate, maxPoints } = req.body;

  const errors: string[] = [];

  if (!title || title.trim().length < 3) {
    errors.push('Assignment title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Assignment description must be at least 10 characters long');
  }

  if (!instructions || instructions.trim().length < 10) {
    errors.push('Assignment instructions must be at least 10 characters long');
  }

  if (!dueDate || isNaN(Date.parse(dueDate))) {
    errors.push('Valid due date is required');
  } else if (new Date(dueDate) <= new Date()) {
    errors.push('Due date must be in the future');
  }

  if (!maxPoints || isNaN(maxPoints) || maxPoints < 1 || maxPoints > 1000) {
    errors.push('Max points must be between 1 and 1000');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validate forum post creation
export const validateForumPostCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, content } = req.body;

  const errors: string[] = [];

  if (!title || title.trim().length < 5) {
    errors.push('Post title must be at least 5 characters long');
  }

  if (!content || content.trim().length < 10) {
    errors.push('Post content must be at least 10 characters long');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validate pagination parameters
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1) {
    res.status(400).json({
      success: false,
      message: 'Page number must be greater than 0'
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
    return;
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};