/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';

// Development controller - Firebase-based seeding functionality disabled
// All seed/clear operations now should be handled via Hygraph CMS directly
// or through dedicated Hygraph seeding scripts if needed

export async function clearAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden in production' 
    });
  }
  
  return res.status(501).json({ 
    success: false, 
    message: 'Firebase seeding functionality removed. Use Hygraph CMS for data management.' 
  });
}

export async function seedAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden in production' 
    });
  }
  
  return res.status(501).json({ 
    success: false, 
    message: 'Firebase seeding functionality removed. Use Hygraph CMS for data management.' 
  });
}