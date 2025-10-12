import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { Course, Enrollment, UserRole } from '../types';

class CourseService {

  /**
   * Creates a new course in Hygraph.
   * @param courseData The course data from the request body.
   * @param instructorId The ID of the instructor creating the course.
   * @param instructorName The display name of the instructor.
   * @returns The newly created course object.
   */
  async createCourse(courseData: Partial<Course>, instructorId: string, instructorName: string): Promise<Course> {
    try {
      const mutation = gql`
        mutation CreateCourse(
          $title: String!
          $description: String!
          $syllabus: String!
          $instructor: String!
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
            instructor: $instructor
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
            instructor
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
        instructor: instructorId,
        instructorName,
        category: courseData.category || 'General',
        thumbnail: courseData.thumbnail || null,
        duration: courseData.duration || 8,
        maxStudents: courseData.maxStudents || 50,
        isActive: courseData.isActive ?? true,
      };

      const response = await hygraphClient.request<{ createCourse: Course }>(mutation, variables);
      return response.createCourse;
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
            instructor
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

      const response = await hygraphClient.request<{ course: Course | null }>(query, { id: courseId });
      return response.course;
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
      if (instructorId) whereConditions.push(`instructor: "${instructorId}"`);
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
                instructor
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
          edges: { node: Course }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const courses = response.coursesConnection.edges.map(edge => edge.node);
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
                instructor
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
          edges: { node: Course }[];
          aggregate: { count: number };
        };
      }>(query, { searchTerm, first: limit, skip });

      const courses = response.coursesConnection.edges.map(edge => edge.node);
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
            instructor
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

      // Filter out undefined values
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          data[key] = value;
        }
      });

      const response = await hygraphClient.request<{ updateCourse: Course }>(mutation, {
        id: courseId,
        data
      });

      return response.updateCourse;
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
      const existingQuery = gql`
        query CheckExistingEnrollment($courseId: String!, $studentId: String!) {
          enrollments(where: { courseId: $courseId, studentId: $studentId }) {
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
        query CheckCourseCapacity($courseId: String!) {
          enrollmentsConnection(where: { courseId: $courseId, status: active }) {
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

      // Create enrollment
      const mutation = gql`
        mutation CreateEnrollment(
          $studentId: String!
          $courseId: String!
          $progress: Int!
          $status: EnrollmentStatus!
        ) {
          createEnrollment(data: {
            studentId: $studentId
            courseId: $courseId
            progress: $progress
            completedLessons: []
            status: $status
          }) {
            id
            studentId
            courseId
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ createEnrollment: Enrollment }>(mutation, {
        studentId,
        courseId,
        progress: 0,
        status: 'active'
      });

      return response.createEnrollment;
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
          enrollments(where: { studentId: $studentId }, orderBy: enrolledAt_DESC) {
            id
            studentId
            courseId
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ enrollments: Enrollment[] }>(query, { studentId });
      return response.enrollments;
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      throw new Error('Failed to get enrollments');
    }
  }

  // Get course enrollments (teacher/admin)
  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    try {
      const query = gql`
        query GetCourseEnrollments($courseId: String!) {
          enrollments(where: { courseId: $courseId }, orderBy: enrolledAt_DESC) {
            id
            studentId
            courseId
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ enrollments: Enrollment[] }>(query, { courseId });
      return response.enrollments;
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
            studentId
            courseId
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const enrollmentResponse = await hygraphClient.request<{ enrollment: Enrollment | null }>(
        enrollmentQuery, 
        { id: enrollmentId }
      );

      const enrollment = enrollmentResponse.enrollment;
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Add lesson to completed lessons if not already there
      const completedLessons = enrollment.completedLessons || [];
      if (!completedLessons.includes(completedLessonId)) {
        completedLessons.push(completedLessonId);
      }

      // Calculate progress (simplified for now - would need lesson count from course)
      const totalLessons = 10; // This should come from the course's lesson count
      const progress = Math.min((completedLessons.length / totalLessons) * 100, 100);
      const status = progress >= 100 ? 'completed' : 'active';

      const mutation = gql`
        mutation UpdateEnrollmentProgress(
          $id: ID!
          $completedLessons: [String!]!
          $progress: Int!
          $status: EnrollmentStatus!
        ) {
          updateEnrollment(
            where: { id: $id }
            data: {
              completedLessons: $completedLessons
              progress: $progress
              status: $status
            }
          ) {
            id
            studentId
            courseId
            enrolledAt
            progress
            completedLessons
            lastAccessedAt
            status
          }
        }
      `;

      const response = await hygraphClient.request<{ updateEnrollment: Enrollment }>(mutation, {
        id: enrollmentId,
        completedLessons,
        progress: Math.round(progress),
        status
      });

      return response.updateEnrollment;
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
      const whereClause = instructorId ? `where: { instructor: "${instructorId}" }` : '';

      const query = gql`
        query GetCourseStats {
          totalCourses: coursesConnection(${whereClause}) { aggregate { count } }
          activeCourses: coursesConnection(${whereClause ? whereClause.replace('}', ', isActive: true }') : 'where: { isActive: true }'}) { aggregate { count } }
          enrollments: enrollmentsConnection { 
            aggregate { count }
            edges { 
              node { 
                studentId 
                progress 
                ${instructorId ? 'course { instructor }' : ''}
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
              studentId: string; 
              progress: number;
              course?: { instructor: string };
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
        if (!instructorId || (enrollment.course && enrollment.course.instructor === instructorId)) {
          uniqueStudents.add(enrollment.studentId);
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