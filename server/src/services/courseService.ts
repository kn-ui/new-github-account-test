import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { Course, Enrollment, UserRole } from '../types';

class CourseService {

  /**
   * Creates a new course in Hygraph using proper relations.
   */
  async createCourse(courseData: Partial<Course>, instructorId: string, instructorName: string): Promise<Course> {
    try {
      const mutation = gql`
        mutation CreateCourse(
          $title: String!
          $description: String!
          $syllabus: String!
          $instructorId: ID!
          $instructorName: String!
          $category: String!
          $thumbnail: String
          $duration: Int!
          $maxStudents: Int!
          $isActive: Boolean!
        ) {
          createCourse(data: {
            title: $title
            description: $description
            syllabus: $syllabus
            instructor: { connect: { uid: $instructorId } }
            instructorName: $instructorName
            category: $category
            thumbnail: $thumbnail
            duration: $duration
            maxStudents: $maxStudents
            isActive: $isActive
          }) {
            id
            title
            description
            syllabus
            instructor { uid displayName }
            instructorName
            category
            thumbnail
            duration
            maxStudents
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        title: courseData.title || 'Untitled Course',
        description: courseData.description || '',
        syllabus: courseData.syllabus || '',
        instructorId: instructorId,
        instructorName,
        category: courseData.category || 'General',
        thumbnail: courseData.thumbnail || null,
        duration: courseData.duration || 8,
        maxStudents: courseData.maxStudents || 50,
        isActive: courseData.isActive ?? true,
      };

      const response = await hygraphClient.request<{ createCourse: any }>(mutation, variables);
      
      // Transform response to match our Course interface
      const course = response.createCourse;
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        syllabus: course.syllabus,
        instructor: course.instructor?.uid || instructorId,
        instructorName: course.instructorName,
        category: course.category,
        thumbnail: course.thumbnail,
        duration: course.duration,
        maxStudents: course.maxStudents,
        isActive: course.isActive,
        createdAt: new Date(course.createdAt),
        updatedAt: new Date(course.updatedAt)
      } as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw new Error('Failed to create course');
    }
  }

  // Get course by ID
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const query = gql`
        query GetCourse($id: ID!) {
          course(where: { id: $id }) {
            id
            title
            description
            syllabus
            instructor { uid displayName }
            instructorName
            category
            thumbnail
            duration
            maxStudents
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ course: any | null }>(query, { id: courseId });
      
      if (!response.course) return null;

      const course = response.course;
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        syllabus: course.syllabus,
        instructor: course.instructor?.uid || '',
        instructorName: course.instructorName,
        category: course.category,
        thumbnail: course.thumbnail,
        duration: course.duration,
        maxStudents: course.maxStudents,
        isActive: course.isActive,
        createdAt: new Date(course.createdAt),
        updatedAt: new Date(course.updatedAt)
      } as Course;
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
      const skip = (page - 1) * limit;
      
      // Build where clause
      const whereConditions: string[] = [];
      if (category) whereConditions.push(`category: "${category}"`);
      if (instructorId) whereConditions.push(`instructor: { uid: "${instructorId}" }`);
      if (isActive !== undefined) whereConditions.push(`isActive: ${isActive}`);
      
      const whereClause = whereConditions.length > 0 ? `where: { ${whereConditions.join(', ')} }` : '';

      const query = gql`
        query GetAllCourses($first: Int!, $skip: Int!) {
          coursesConnection(${whereClause}, first: $first, skip: $skip, orderBy: createdAt_DESC) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                syllabus
                instructor { uid displayName }
                instructorName
                category
                thumbnail
                duration
                maxStudents
                isActive
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        coursesConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const courses = response.coursesConnection.edges.map(edge => {
        const course = edge.node;
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          syllabus: course.syllabus,
          instructor: course.instructor?.uid || '',
          instructorName: course.instructorName,
          category: course.category,
          thumbnail: course.thumbnail,
          duration: course.duration,
          maxStudents: course.maxStudents,
          isActive: course.isActive,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt)
        } as Course;
      });
      
      const total = response.coursesConnection.aggregate.count;

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
      const skip = (page - 1) * limit;
      
      const query = gql`
        query SearchCourses($searchTerm: String!, $first: Int!, $skip: Int!) {
          coursesConnection(
            where: { 
              isActive: true,
              OR: [
                { title_contains: $searchTerm },
                { description_contains: $searchTerm },
                { category_contains: $searchTerm }
              ]
            }, 
            first: $first, 
            skip: $skip, 
            orderBy: createdAt_DESC
          ) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                syllabus
                instructor { uid displayName }
                instructorName
                category
                thumbnail
                duration
                maxStudents
                isActive
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        coursesConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { searchTerm, first: limit, skip });

      const courses = response.coursesConnection.edges.map(edge => {
        const course = edge.node;
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          syllabus: course.syllabus,
          instructor: course.instructor?.uid || '',
          instructorName: course.instructorName,
          category: course.category,
          thumbnail: course.thumbnail,
          duration: course.duration,
          maxStudents: course.maxStudents,
          isActive: course.isActive,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt)
        } as Course;
      });
      
      const total = response.coursesConnection.aggregate.count;

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

      const mutation = gql`
        mutation UpdateCourse($id: ID!, $data: CourseUpdateInput!) {
          updateCourse(where: { id: $id }, data: $data) {
            id
            title
            description
            syllabus
            instructor { uid displayName }
            instructorName
            category
            thumbnail
            duration
            maxStudents
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values and prepare data
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'instructor') {
          data[key] = value;
        }
      });

      const response = await hygraphClient.request<{ updateCourse: any }>(mutation, {
        id: courseId,
        data
      });

      const updatedCourse = response.updateCourse;
      return {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        syllabus: updatedCourse.syllabus,
        instructor: updatedCourse.instructor?.uid || '',
        instructorName: updatedCourse.instructorName,
        category: updatedCourse.category,
        thumbnail: updatedCourse.thumbnail,
        duration: updatedCourse.duration,
        maxStudents: updatedCourse.maxStudents,
        isActive: updatedCourse.isActive,
        createdAt: new Date(updatedCourse.createdAt),
        updatedAt: new Date(updatedCourse.updatedAt)
      } as Course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  }

  // Delete course (admin only)
  async deleteCourse(courseId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteCourse($id: ID!) {
          deleteCourse(where: { id: $id }) { id }
        }
      `;

      await hygraphClient.request(mutation, { id: courseId });
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  // Enroll student in course using proper relations
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
      const existingQuery = gql`
        query CheckExistingEnrollment($courseId: ID!, $studentId: String!) {
          enrollments(where: { course: { id: $courseId }, student: { uid: $studentId } }) {
            id
          }
        }
      `;

      const existingResponse = await hygraphClient.request<{ enrollments: { id: string }[] }>(
        existingQuery, 
        { courseId, studentId }
      );

      if (existingResponse.enrollments.length > 0) {
        throw new Error('Student already enrolled in this course');
      }

      // Check capacity (count active enrollments)
      const capacityQuery = gql`
        query CheckCourseCapacity($courseId: ID!) {
          enrollmentsConnection(where: { course: { id: $courseId }, status: ACTIVE }) {
            aggregate { count }
          }
        }
      `;

      const capacityResponse = await hygraphClient.request<{
        enrollmentsConnection: { aggregate: { count: number } };
      }>(capacityQuery, { courseId });

      if (capacityResponse.enrollmentsConnection.aggregate.count >= course.maxStudents) {
        throw new Error('Course is full');
      }

      // Create enrollment using relations
      const mutation = gql`
        mutation CreateEnrollment(
          $studentId: String!
          $courseId: ID!
          $progress: Int!
          $status: EnrollmentStatus!
        ) {
          createEnrollment(data: {
            student: { connect: { uid: $studentId } }
            course: { connect: { id: $courseId } }
            progress: $progress
            completedLessons: ""
            status: $status
            enrolledAt: "${new Date().toISOString()}"
            lastAccessedAt: "${new Date().toISOString()}"
            isActive: true
          }) {
            id
            student { uid }
            course { id }
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ createEnrollment: any }>(mutation, {
        studentId,
        courseId,
        progress: 0,
        status: 'ACTIVE'
      });

      const enrollment = response.createEnrollment;
      return {
        id: enrollment.id,
        studentId: enrollment.student?.uid || studentId,
        courseId: enrollment.course?.id || courseId,
        enrolledAt: new Date(enrollment.enrolledAt),
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons ? enrollment.completedLessons.split(',').filter(Boolean) : [],
        lastAccessedAt: new Date(enrollment.lastAccessedAt),
        status: enrollment.status.toLowerCase()
      } as Enrollment;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw new Error('Failed to enroll student');
    }
  }

  // Get student enrollments
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    try {
      const query = gql`
        query GetStudentEnrollments($studentId: String!) {
          enrollments(where: { student: { uid: $studentId } }, orderBy: enrolledAt_DESC) {
            id
            student { uid }
            course { id }
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ enrollments: any[] }>(query, { studentId });
      
      return response.enrollments.map(enrollment => ({
        id: enrollment.id,
        studentId: enrollment.student?.uid || studentId,
        courseId: enrollment.course?.id || '',
        enrolledAt: new Date(enrollment.enrolledAt),
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons ? enrollment.completedLessons.split(',').filter(Boolean) : [],
        lastAccessedAt: new Date(enrollment.lastAccessedAt),
        status: enrollment.status.toLowerCase()
      } as Enrollment));
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      throw new Error('Failed to get enrollments');
    }
  }

  // Get course enrollments (teacher/admin)
  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    try {
      const query = gql`
        query GetCourseEnrollments($courseId: ID!) {
          enrollments(where: { course: { id: $courseId } }, orderBy: enrolledAt_DESC) {
            id
            student { uid }
            course { id }
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ enrollments: any[] }>(query, { courseId });
      
      return response.enrollments.map(enrollment => ({
        id: enrollment.id,
        studentId: enrollment.student?.uid || '',
        courseId: enrollment.course?.id || courseId,
        enrolledAt: new Date(enrollment.enrolledAt),
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons ? enrollment.completedLessons.split(',').filter(Boolean) : [],
        lastAccessedAt: new Date(enrollment.lastAccessedAt),
        status: enrollment.status.toLowerCase()
      } as Enrollment));
    } catch (error) {
      console.error('Error getting course enrollments:', error);
      throw new Error('Failed to get course enrollments');
    }
  }

  // Update enrollment progress
  async updateEnrollmentProgress(enrollmentId: string, completedLessonId: string): Promise<Enrollment> {
    try {
      // Get current enrollment
      const enrollmentQuery = gql`
        query GetEnrollment($id: ID!) {
          enrollment(where: { id: $id }) {
            id
            student { uid }
            course { id }
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const enrollmentResponse = await hygraphClient.request<{ enrollment: any | null }>(
        enrollmentQuery, 
        { id: enrollmentId }
      );

      const enrollment = enrollmentResponse.enrollment;
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Add lesson to completed lessons if not already there
      const completedLessons = enrollment.completedLessons ? enrollment.completedLessons.split(',').filter(Boolean) : [];
      if (!completedLessons.includes(completedLessonId)) {
        completedLessons.push(completedLessonId);
      }

      // Calculate progress (simplified for now - would need lesson count from course)
      const totalLessons = 10; // This should come from the course's lesson count
      const progress = Math.min((completedLessons.length / totalLessons) * 100, 100);
      const status = progress >= 100 ? 'COMPLETED' : 'ACTIVE';

      const mutation = gql`
        mutation UpdateEnrollmentProgress(
          $id: ID!
          $completedLessons: String!
          $progress: Int!
          $status: EnrollmentStatus!
        ) {
          updateEnrollment(
            where: { id: $id }
            data: {
              completedLessons: $completedLessons
              progress: $progress
              status: $status
              lastAccessedAt: "${new Date().toISOString()}"
            }
          ) {
            id
            student { uid }
            course { id }
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ updateEnrollment: any }>(mutation, {
        id: enrollmentId,
        completedLessons: completedLessons.join(','),
        progress: Math.round(progress),
        status
      });

      const updatedEnrollment = response.updateEnrollment;
      return {
        id: updatedEnrollment.id,
        studentId: updatedEnrollment.student?.uid || '',
        courseId: updatedEnrollment.course?.id || '',
        enrolledAt: new Date(updatedEnrollment.enrolledAt),
        progress: updatedEnrollment.progress,
        completedLessons: updatedEnrollment.completedLessons ? updatedEnrollment.completedLessons.split(',').filter(Boolean) : [],
        lastAccessedAt: new Date(updatedEnrollment.lastAccessedAt),
        status: updatedEnrollment.status.toLowerCase()
      } as Enrollment;
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
      const instructorWhere = instructorId ? `where: { instructor: { uid: "${instructorId}" } }` : '';

      const query = gql`
        query GetCourseStats {
          totalCourses: coursesConnection(${instructorWhere}) { aggregate { count } }
          activeCourses: coursesConnection(${instructorWhere ? instructorWhere.replace('}', ', isActive: true }') : 'where: { isActive: true }'}) { aggregate { count } }
          enrollments: enrollmentsConnection { 
            aggregate { count }
            edges { 
              node { 
                student { uid }
                progress 
                course { instructor { uid } }
              } 
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        totalCourses: { aggregate: { count: number } };
        activeCourses: { aggregate: { count: number } };
        enrollments: {
          aggregate: { count: number };
          edges: { 
            node: { 
              student: { uid: string };
              progress: number;
              course?: { instructor?: { uid: string } };
            } 
          }[];
        };
      }>(query);

      // Count unique students and calculate completion rate
      const uniqueStudents = new Set<string>();
      let totalProgress = 0;
      let progressCount = 0;

      response.enrollments.edges.forEach(({ node: enrollment }) => {
        // Filter by instructor if specified
        if (!instructorId || (enrollment.course?.instructor?.uid === instructorId)) {
          uniqueStudents.add(enrollment.student.uid);
          if (typeof enrollment.progress === 'number') {
            totalProgress += enrollment.progress;
            progressCount += 1;
          }
        }
      });

      const completionRate = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

      return {
        totalCourses: response.totalCourses.aggregate.count,
        activeCourses: response.activeCourses.aggregate.count,
        totalEnrollments: response.enrollments.aggregate.count,
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