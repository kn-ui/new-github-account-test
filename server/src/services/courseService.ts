import { firestore } from '../config/firebase';
import { Course, Enrollment, UserRole } from '../types';

class CourseService {
  private coursesCollection = firestore?.collection('courses');
  private enrollmentsCollection = firestore?.collection('enrollments');
  private submissionsCollection = firestore?.collection('submissions');

  /**
   * Creates a new course in Firestore.
   * @param courseData The course data from the request body.
   * @param instructorId The ID of the instructor creating the course.
   * @param instructorName The display name of the instructor.
   * @returns The newly created course object.
   */
  async createCourse(courseData: Partial<Course>, instructorId: string, instructorName: string): Promise<Course> {
    try {
      // Create a document object.
      // This is the point where we need to ensure no fields are undefined.
      const rawCourseDoc = {
        ...courseData,
        instructor: instructorId,
        instructorName,
        isActive: courseData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Filter out any undefined properties from the document before saving.
      const courseDoc = Object.fromEntries(
        Object.entries(rawCourseDoc).filter(([_, value]) => value !== undefined)
      );

      // Now, the 'thumbnail' field will only exist if it had a value.
      const docRef = await this.coursesCollection.add(courseDoc);
      
      return { id: docRef.id, ...courseDoc } as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw new Error('Failed to create course');
    }
  }

  // Rest of your CourseService class methods...

  // Get course by ID
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const courseDoc = await this.coursesCollection.doc(courseId).get();
      
      if (!courseDoc.exists) {
        return null;
      }

      return { id: courseDoc.id, ...courseDoc.data() } as Course;
    } catch (error) {
      console.error('Error getting course:', error);
      throw new Error('Failed to get course');
    }
  }

  // Get all courses with pagination and filtering
  async getAllCourses(
    page: number = 1, 
    limit: number = 10, 
    category?: string,
    instructorId?: string,
    isActive?: boolean
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!this.coursesCollection) {
        return { courses: [], total: 0, page, totalPages: 0 };
      }

      let query = this.coursesCollection.orderBy('createdAt', 'desc');

      if (category) {
        query = query.where('category', '==', category) as any;
      }

      if (instructorId) {
        query = query.where('instructor', '==', instructorId) as any;
      }

      if (isActive !== undefined) {
        query = query.where('isActive', '==', isActive) as any;
      }

      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Get paginated results
      const offset = (page - 1) * limit;
      const snapshot = await query.offset(offset).limit(limit).get();

      const courses: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));

      console.log('getAllCourses - Fetched courses:', courses);
      console.log('getAllCourses - Total courses:', total);

      return {
        courses,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting all courses:', error);
      throw new Error('Failed to get courses');
    }
  }

  // Search courses
  async searchCourses(searchTerm: string, page: number = 1, limit: number = 10): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Basic search by title and description
      const titleQuery = this.coursesCollection
        .where('title', '>=', searchTerm)
        .where('title', '<=', searchTerm + '\uf8ff')
        .where('isActive', '==', true);

      const categoryQuery = this.coursesCollection
        .where('category', '>=', searchTerm)
        .where('category', '<=', searchTerm + '\uf8ff')
        .where('isActive', '==', true);

      const [titleResults, categoryResults] = await Promise.all([
        titleQuery.get(),
        categoryQuery.get()
      ]);

      // Combine and deduplicate results
      const courseMap = new Map<string, Course>();
      
      titleResults.docs.forEach(doc => {
        courseMap.set(doc.id, { id: doc.id, ...doc.data() } as Course);
      });
      
      categoryResults.docs.forEach(doc => {
        courseMap.set(doc.id, { id: doc.id, ...doc.data() } as Course);
      });

      const allCourses = Array.from(courseMap.values());
      const total = allCourses.length;

      // Manual pagination
      const offset = (page - 1) * limit;
      const courses = allCourses.slice(offset, offset + limit);

      return {
        courses,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error searching courses:', error);
      throw new Error('Failed to search courses');
    }
  }

  // Update course
  async updateCourse(courseId: string, updateData: Partial<Course>, instructorId: string): Promise<Course> {
    try {
      // Verify the instructor owns this course or is admin
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructor !== instructorId) {
        throw new Error('Unauthorized to update this course');
      }

      const updateDoc = {
        ...updateData,
        updatedAt: new Date()
      };

      await this.coursesCollection.doc(courseId).update(updateDoc);
      
      const updatedCourse = await this.getCourseById(courseId);
      if (!updatedCourse) {
        throw new Error('Course not found after update');
      }

      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  }

  // Delete course (admin only)
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.coursesCollection.doc(courseId).delete();
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  // Enroll student in course
  async enrollStudent(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      if (!course.isActive) {
        throw new Error('Course is not active');
      }

      // Check for existing enrollment
      const existing = await this.enrollmentsCollection
        .where('courseId', '==', courseId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get();
      if (!existing.empty) {
        throw new Error('Student already enrolled in this course');
      }

      // Check capacity (count active enrollments)
      const activeCountSnap = await this.enrollmentsCollection
        .where('courseId', '==', courseId)
        .where('status', '==', 'active')
        .get();
      if (activeCountSnap.size >= course.maxStudents) {
        throw new Error('Course is full');
      }

      // Create enrollment record with deterministic id courseId_uid
      const enrollmentData = {
        studentId,
        courseId,
        enrolledAt: new Date(),
        progress: 0,
        completedLessons: [],
        lastAccessedAt: new Date(),
        status: 'active' as const
      };

      const enrollmentId = `${courseId}_${studentId}`;
      await this.enrollmentsCollection.doc(enrollmentId).set(enrollmentData);

      return { id: enrollmentId, ...enrollmentData };
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw new Error('Failed to enroll student');
    }
  }

  // Get student enrollments
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    try {
      const snapshot = await this.enrollmentsCollection
        .where('studentId', '==', studentId)
        .orderBy('enrolledAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Enrollment));
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      throw new Error('Failed to get enrollments');
    }
  }

  // Get course enrollments (teacher/admin)
  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    try {
      const snapshot = await this.enrollmentsCollection
        .where('courseId', '==', courseId)
        .orderBy('enrolledAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Enrollment));
    } catch (error) {
      console.error('Error getting course enrollments:', error);
      throw new Error('Failed to get course enrollments');
    }
  }

  // Update enrollment progress
  async updateEnrollmentProgress(enrollmentId: string, completedLessonId: string): Promise<Enrollment> {
    try {
      const enrollmentDoc = await this.enrollmentsCollection.doc(enrollmentId).get();
      
      if (!enrollmentDoc.exists) {
        throw new Error('Enrollment not found');
      }

      const enrollmentData = enrollmentDoc.data() as Enrollment;
      
      // Add lesson to completed lessons if not already there
      const completedLessons = enrollmentData.completedLessons || [];
      if (!completedLessons.includes(completedLessonId)) {
        completedLessons.push(completedLessonId);
      }

      // Get total lessons count for the course
      const course = await this.getCourseById(enrollmentData.courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const totalLessons = 0; // moved to subcollection; compute elsewhere if needed
      const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : enrollmentData.progress || 0;

      const updateData = {
        completedLessons,
        progress,
        lastAccessedAt: new Date(),
        status: progress >= 100 ? 'completed' as const : 'active' as const,
        updatedAt: new Date()
      };

      await this.enrollmentsCollection.doc(enrollmentId).update(updateData);

      return { ...enrollmentData, ...updateData, id: enrollmentId };
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
      throw new Error('Failed to update progress');
    }
  }

  // Get course statistics
  async getCourseStats(instructorId?: string): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    totalStudents: number;
    completionRate: number;
  }> {
    try {
      let coursesQuery = this.coursesCollection;
      if (instructorId) {
        coursesQuery = coursesQuery.where('instructor', '==', instructorId) as any;
      }

      const [
        allCoursesSnapshot,
        activeCoursesSnapshot,
        enrollmentsSnapshot
      ] = await Promise.all([
        coursesQuery.get(),
        coursesQuery.where('isActive', '==', true).get(),
        this.enrollmentsCollection.get()
      ]);

      // Count unique students
      const uniqueStudents = new Set<string>();
      let totalProgress = 0;
      let progressCount = 0;
      enrollmentsSnapshot.docs.forEach(doc => {
        const enrollment = doc.data() as any;
        // Only include enrollments for the instructor when requested
        if (!instructorId) {
          uniqueStudents.add(enrollment.studentId);
          if (typeof enrollment.progress === 'number') {
            totalProgress += enrollment.progress;
            progressCount += 1;
          }
        } else {
          // Check if enrollment belongs to instructor's course
          const courseId = enrollment.courseId;
          const course = allCoursesSnapshot.docs.find(courseDoc => 
            courseDoc.id === courseId && courseDoc.data().instructor === instructorId
          );
          if (course) {
            uniqueStudents.add(enrollment.studentId);
            if (typeof enrollment.progress === 'number') {
              totalProgress += enrollment.progress;
              progressCount += 1;
            }
          }
        }
      });

      const completionRate = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

      return {
        totalCourses: allCoursesSnapshot.size,
        activeCourses: activeCoursesSnapshot.size,
        totalEnrollments: enrollmentsSnapshot.size,
        totalStudents: uniqueStudents.size,
        completionRate
      };
    } catch (error) {
      console.error('Error getting course stats:', error);
      throw new Error('Failed to get course statistics');
    }
  }
}

export default new CourseService();
