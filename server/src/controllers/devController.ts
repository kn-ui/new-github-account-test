/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { hygraphUserService } from '../services/hygraphUserService';
import { hygraphCourseService } from '../services/hygraphCourseService';

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], n: number) {
  const copy = [...arr]; const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  return out;
}

export async function clearAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Forbidden in production' });
  try {
    // Note: Hygraph doesn't support bulk delete operations like Firebase
    // This is a placeholder for future implementation
    return res.json({ 
      success: true, 
      message: 'Clear operation not supported in Hygraph. Use Hygraph dashboard to manage data.', 
      data: { deleted: 0 } 
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || 'Clear failed' });
  }
}

export async function seedAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Forbidden in production' });
  try {
    // Note: Hygraph seeding is more complex than Firebase
    // This is a simplified version that creates basic test data
    
    // Create test users
    const teachers = Array.from({ length: 2 }).map((_, i) => ({
      uid: `teacher_${i+1}`,
      displayName: `Teacher ${i+1}`,
      email: `teacher${i+1}@example.com`,
      role: 'TEACHER' as Role,
      isActive: true
    }));
    
    const students = Array.from({ length: 3 }).map((_, i) => ({
      uid: `student_${i+1}`,
      displayName: `Student ${i+1}`,
      email: `student${i+1}@example.com`,
      role: 'STUDENT' as Role,
      isActive: true
    }));
    
    const superAdmin = {
      uid: 'super_admin',
      displayName: 'Super Admin',
      email: 'superadmin@example.com',
      role: 'SUPER_ADMIN' as Role,
      isActive: true
    };

    // Create users in Hygraph
    const allUsers = [...teachers, ...students, superAdmin];
    for (const user of allUsers) {
      try {
        await hygraphUserService.createUser(user);
      } catch (error) {
        console.log(`User ${user.uid} might already exist, skipping...`);
      }
    }

    // Create test courses
    const courseDefs = [
      { title: 'React Fundamentals', description: 'Intro to React', category: 'Web Dev', duration: 8, maxStudents: 50, syllabus: 'Components, Hooks', isActive: true },
      { title: 'Database Design', description: 'ERD, SQL', category: 'Database', duration: 10, maxStudents: 40, syllabus: 'Normalization, SQL', isActive: true },
    ];
    
    const courses = [];
    for (let i = 0; i < courseDefs.length; i++) {
      const course = courseDefs[i];
      const instructor = teachers[i % teachers.length];
      try {
        const createdCourse = await hygraphCourseService.createCourse({
          ...course,
          instructorId: instructor.uid,
          instructorName: instructor.displayName
        });
        courses.push(createdCourse);
      } catch (error) {
        console.log(`Course ${course.title} might already exist, skipping...`);
      }
    }

    return res.json({ 
      success: true, 
      message: 'Hygraph seeding complete (simplified version)', 
      data: { 
        users: allUsers.length,
        courses: courses.length,
        note: 'This is a simplified seeding. Use Hygraph dashboard for full data management.'
      } 
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message || 'Seed failed' });
  }
}

