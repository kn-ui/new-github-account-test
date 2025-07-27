import { Response } from 'express';
import { ApiResponse } from '../types';

// Success response helper
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error
  };
  res.status(statusCode).json(response);
};

// Paginated response helper
export const sendPaginatedResponse = <T>(
  res: Response,
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): void => {
  const totalPages = Math.ceil(total / limit);
  
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
  
  res.status(statusCode).json(response);
};

// Created response helper
export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T
): void => {
  sendSuccess(res, message, data, 201);
};

// Not found response helper
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, undefined, 404);
};

// Unauthorized response helper
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): void => {
  sendError(res, message, undefined, 401);
};

// Forbidden response helper
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden access'
): void => {
  sendError(res, message, undefined, 403);
};

// Internal server error response helper
export const sendServerError = (
  res: Response,
  message: string = 'Internal server error',
  error?: string
): void => {
  sendError(res, message, error, 500);
};