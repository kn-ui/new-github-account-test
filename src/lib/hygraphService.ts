/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hygraph Service Layer
 * This service provides a similar API to the Firebase Firestore service
 * but uses Hygraph GraphQL backend instead
 */

import { hygraphQuery, hygraphMutation } from './hygraph';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';

// ==================== USER SERVICE ====================

export const userService = {
  async getUserById(uid: string) {
    const result = await hygraphQuery(queries.GET_USER_BY_UID, {
      variables: { uid },
    });
    return result.user;
  },

  async getUserByEmail(email: string) {
    const result = await hygraphQuery(queries.GET_USER_BY_EMAIL, {
      variables: { email },
    });
    return result.user;
  },

  async getUsers(limitCount = 50) {
    const result = await hygraphQuery(queries.GET_USERS, {
      variables: { first: limitCount },
    });
    return result.users || [];
  },

  async getTeachers() {
    const result = await hygraphQuery(queries.GET_TEACHERS);
    return result.users || [];
  },

  async getStudents() {
    const result = await hygraphQuery(queries.GET_STUDENTS);
    return result.users || [];
  },

  async createUser(userData: any) {
    const result = await hygraphMutation(mutations.CREATE_USER, {
      variables: {
        data: {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role.toUpperCase(),
          isActive: userData.isActive ?? true,
          passwordChanged: userData.passwordChanged ?? false,
        },
      },
    });
    
    // Publish the user to make it available via the public API
    await hygraphMutation(mutations.PUBLISH_USER, {
      variables: { id: result.createUser.id },
    });
    
    return result.createUser.id;
  },

  async updateUser(uid: string, updates: any) {
    const updateData: any = {};
    
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.role !== undefined) updateData.role = updates.role.toUpperCase();
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.passwordChanged !== undefined) updateData.passwordChanged = updates.passwordChanged;
    
    const result = await hygraphMutation(mutations.UPDATE_USER, {
      variables: { uid, data: updateData },
    });
    
    // Publish the updated user
    if (result.updateUser) {
      await hygraphMutation(mutations.PUBLISH_USER, {
        variables: { id: result.updateUser.id },
      });
    }
  },

  async deleteUser(uid: string) {
    await hygraphMutation(mutations.DELETE_USER, {
      variables: { uid },
    });
  },
};

// ==================== COURSE SERVICE ====================

export const courseService = {
  async getCourses(limitCount = 10) {
    const result = await hygraphQuery(queries.GET_COURSES, {
      variables: { first: limitCount },
    });
    return result.courses || [];
  },

  async getCourseById(courseId: string) {
    const result = await hygraphQuery(queries.GET_COURSE_BY_ID, {
      variables: { id: courseId },
    });
    return result.course;
  },

  async getCoursesByInstructor(instructorUid: string) {
    const result = await hygraphQuery(queries.GET_COURSES_BY_INSTRUCTOR, {
      variables: { instructorUid },
    });
    return result.courses || [];
  },

  async createCourse(courseData: any) {
    const result = await hygraphMutation(mutations.CREATE_COURSE, {
      variables: {
        data: {
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          duration: courseData.duration,
          maxStudents: courseData.maxStudents,
          syllabus: courseData.syllabus,
          isActive: courseData.isActive ?? true,
          instructorName: courseData.instructorName,
          instructor: {
            connect: { uid: courseData.instructor },
          },
        },
      },
    });
    
    await hygraphMutation(mutations.PUBLISH_COURSE, {
      variables: { id: result.createCourse.id },
    });
    
    return result.createCourse.id;
  },

  async updateCourse(courseId: string, updates: any) {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.maxStudents !== undefined) updateData.maxStudents = updates.maxStudents;
    if (updates.syllabus !== undefined) updateData.syllabus = updates.syllabus;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.instructorName !== undefined) updateData.instructorName = updates.instructorName;
    
    const result = await hygraphMutation(mutations.UPDATE_COURSE, {
      variables: { id: courseId, data: updateData },
    });
    
    if (result.updateCourse) {
      await hygraphMutation(mutations.PUBLISH_COURSE, {
        variables: { id: result.updateCourse.id },
      });
    }
  },

  async deleteCourse(courseId: string) {
    await hygraphMutation(mutations.DELETE_COURSE, {
      variables: { id: courseId },
    });
  },
};

// ==================== ENROLLMENT SERVICE ====================

export const enrollmentService = {
  async getEnrollmentsByStudent(studentUid: string) {
    const result = await hygraphQuery(queries.GET_ENROLLMENTS_BY_STUDENT, {
      variables: { studentUid },
    });
    return result.enrollments || [];
  },

  async getEnrollmentsByCourse(courseId: string) {
    const result = await hygraphQuery(queries.GET_ENROLLMENTS_BY_COURSE, {
      variables: { courseId },
    });
    return result.enrollments || [];
  },

  async getAllEnrollments() {
    const result = await hygraphQuery(queries.GET_ALL_ENROLLMENTS);
    return result.enrollments || [];
  },

  async createEnrollment(enrollmentData: any) {
    const result = await hygraphMutation(mutations.CREATE_ENROLLMENT, {
      variables: {
        data: {
          student: { connect: { uid: enrollmentData.studentId } },
          course: { connect: { id: enrollmentData.courseId } },
          status: enrollmentData.status?.toUpperCase() || 'ACTIVE',
          progress: enrollmentData.progress || 0,
          completedLessons: enrollmentData.completedLessons || [],
          isActive: true,
          enrolledAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
        },
      },
    });
    
    await hygraphMutation(mutations.PUBLISH_ENROLLMENT, {
      variables: { id: result.createEnrollment.id },
    });
    
    return result.createEnrollment.id;
  },

  async updateEnrollmentProgress(enrollmentId: string, progress: number, completedLessons: string[]) {
    const result = await hygraphMutation(mutations.UPDATE_ENROLLMENT, {
      variables: {
        id: enrollmentId,
        data: {
          progress,
          completedLessons,
          lastAccessedAt: new Date().toISOString(),
        },
      },
    });
    
    if (result.updateEnrollment) {
      await hygraphMutation(mutations.PUBLISH_ENROLLMENT, {
        variables: { id: result.updateEnrollment.id },
      });
    }
  },

  async deleteEnrollment(enrollmentId: string) {
    await hygraphMutation(mutations.DELETE_ENROLLMENT, {
      variables: { id: enrollmentId },
    });
  },
};

// ==================== ASSIGNMENT SERVICE ====================

export const assignmentService = {
  async getAssignmentsByCourse(courseId: string, limitCount = 50) {
    const result = await hygraphQuery(queries.GET_ASSIGNMENTS_BY_COURSE, {
      variables: { courseId, first: limitCount },
    });
    return result.assignments || [];
  },

  async getAssignmentById(assignmentId: string) {
    const result = await hygraphQuery(queries.GET_ASSIGNMENT_BY_ID, {
      variables: { id: assignmentId },
    });
    return result.assignment;
  },

  async getAssignmentsByTeacher(teacherUid: string) {
    const result = await hygraphQuery(queries.GET_ASSIGNMENTS_BY_TEACHER, {
      variables: { teacherUid },
    });
    return result.assignments || [];
  },

  async createAssignment(assignmentData: any) {
    const result = await hygraphMutation(mutations.CREATE_ASSIGNMENT, {
      variables: {
        data: {
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          dueDate: assignmentData.dueDate,
          maxScore: assignmentData.maxScore,
          isActive: true,
          course: { connect: { id: assignmentData.courseId } },
          teacher: { connect: { uid: assignmentData.teacherId } },
        },
      },
    });
    
    await hygraphMutation(mutations.PUBLISH_ASSIGNMENT, {
      variables: { id: result.createAssignment.id },
    });
    
    return result.createAssignment.id;
  },

  async updateAssignment(assignmentId: string, updates: any) {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    if (updates.maxScore !== undefined) updateData.maxScore = updates.maxScore;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    const result = await hygraphMutation(mutations.UPDATE_ASSIGNMENT, {
      variables: { id: assignmentId, data: updateData },
    });
    
    if (result.updateAssignment) {
      await hygraphMutation(mutations.PUBLISH_ASSIGNMENT, {
        variables: { id: result.updateAssignment.id },
      });
    }
  },

  async deleteAssignment(assignmentId: string) {
    await hygraphMutation(mutations.DELETE_ASSIGNMENT, {
      variables: { id: assignmentId },
    });
  },
};

// ==================== SUBMISSION SERVICE ====================

export const submissionService = {
  async getSubmissionsByStudent(studentUid: string) {
    const result = await hygraphQuery(queries.GET_SUBMISSIONS_BY_STUDENT, {
      variables: { studentUid },
    });
    return result.submissions || [];
  },

  async getSubmissionsByAssignment(assignmentId: string) {
    const result = await hygraphQuery(queries.GET_SUBMISSIONS_BY_ASSIGNMENT, {
      variables: { assignmentId },
    });
    return result.submissions || [];
  },

  async getSubmission(submissionId: string) {
    const result = await hygraphQuery(queries.GET_SUBMISSION_BY_ID, {
      variables: { id: submissionId },
    });
    return result.submission;
  },

  async createSubmission(submissionData: any) {
    const result = await hygraphMutation(mutations.CREATE_SUBMISSION, {
      variables: {
        data: {
          content: submissionData.content,
          status: submissionData.status?.toUpperCase() || 'SUBMITTED',
          maxScore: submissionData.maxScore,
          isActive: true,
          assignment: { connect: { id: submissionData.assignmentId } },
          student: { connect: { uid: submissionData.studentId } },
          course: { connect: { id: submissionData.courseId } },
          submittedAt: new Date().toISOString(),
        },
      },
    });
    
    await hygraphMutation(mutations.PUBLISH_SUBMISSION, {
      variables: { id: result.createSubmission.id },
    });
    
    return result.createSubmission.id;
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string) {
    const result = await hygraphMutation(mutations.GRADE_SUBMISSION, {
      variables: { id: submissionId, grade, feedback },
    });
    
    if (result.updateSubmission) {
      await hygraphMutation(mutations.PUBLISH_SUBMISSION, {
        variables: { id: result.updateSubmission.id },
      });
    }
  },

  async updateSubmission(submissionId: string, updates: any) {
    const updateData: any = {};
    
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.status !== undefined) updateData.status = updates.status.toUpperCase();
    if (updates.grade !== undefined) updateData.grade = updates.grade;
    if (updates.feedback !== undefined) updateData.feedback = updates.feedback;
    
    const result = await hygraphMutation(mutations.UPDATE_SUBMISSION, {
      variables: { id: submissionId, data: updateData },
    });
    
    if (result.updateSubmission) {
      await hygraphMutation(mutations.PUBLISH_SUBMISSION, {
        variables: { id: result.updateSubmission.id },
      });
    }
  },
};

// ==================== ANNOUNCEMENT SERVICE ====================

export const announcementService = {
  async getAnnouncements(courseId?: string, limitCount = 20) {
    const result = await hygraphQuery(queries.GET_ANNOUNCEMENTS, {
      variables: { first: limitCount, courseId },
    });
    return result.announcements || [];
  },

  async getAnnouncementsForStudent(studentUid: string, enrolledCourseIds: string[], limitCount = 20) {
    const result = await hygraphQuery(queries.GET_ANNOUNCEMENTS_FOR_STUDENT, {
      variables: { studentUid, first: limitCount },
    });
    
    // Filter announcements client-side based on targeting rules
    const announcements = result.announcements || [];
    return announcements.filter((announcement: any) => {
      // General announcements (no course, no specific recipient)
      if (!announcement.course && !announcement.recipientStudentId) return true;
      
      // Course-specific announcements (student is enrolled)
      if (announcement.course && enrolledCourseIds.includes(announcement.course.id) && !announcement.recipientStudentId) return true;
      
      // Direct announcements to this student
      if (announcement.recipientStudentId === studentUid) return true;
      
      return false;
    });
  },

  async createAnnouncement(announcementData: any) {
    const data: any = {
      title: announcementData.title,
      body: announcementData.body,
      targetAudience: announcementData.targetAudience,
      author: { connect: { uid: announcementData.authorId } },
      createdAt: new Date().toISOString(),
    };
    
    if (announcementData.courseId) {
      data.course = { connect: { id: announcementData.courseId } };
    }
    
    if (announcementData.recipientStudentId) {
      data.recipientStudentId = announcementData.recipientStudentId;
    }
    
    if (announcementData.externalLink) {
      data.externalLink = announcementData.externalLink;
    }
    
    const result = await hygraphMutation(mutations.CREATE_ANNOUNCEMENT, {
      variables: { data },
    });
    
    await hygraphMutation(mutations.PUBLISH_ANNOUNCEMENT, {
      variables: { id: result.createAnnouncement.id },
    });
    
    return result.createAnnouncement.id;
  },

  async deleteAnnouncement(announcementId: string) {
    await hygraphMutation(mutations.DELETE_ANNOUNCEMENT, {
      variables: { id: announcementId },
    });
  },
};

// ==================== EVENT SERVICE ====================

export const eventService = {
  async getEvents(limitCount = 10) {
    const result = await hygraphQuery(queries.GET_EVENTS, {
      variables: { first: limitCount },
    });
    return result.events || [];
  },

  async getAllEvents() {
    const result = await hygraphQuery(queries.GET_EVENTS, {
      variables: { first: 1000 },
    });
    return result.events || [];
  },

  async createEvent(eventData: any) {
    const result = await hygraphMutation(mutations.CREATE_EVENT, {
      variables: {
        data: {
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          type: eventData.type,
          maxAttendees: eventData.maxAttendees,
          currentAttendees: eventData.currentAttendees || 0,
          status: eventData.status?.toUpperCase() || 'UPCOMING',
          isActive: true,
          createdBy: eventData.createdBy,
          createdAt: new Date().toISOString(),
        },
      },
    });
    
    await hygraphMutation(mutations.PUBLISH_EVENT, {
      variables: { id: result.createEvent.id },
    });
    
    return result.createEvent.id;
  },

  async updateEvent(eventId: string, updates: any) {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.status !== undefined) updateData.status = updates.status.toUpperCase();
    if (updates.currentAttendees !== undefined) updateData.currentAttendees = updates.currentAttendees;
    
    const result = await hygraphMutation(mutations.UPDATE_EVENT, {
      variables: { id: eventId, data: updateData },
    });
    
    if (result.updateEvent) {
      await hygraphMutation(mutations.PUBLISH_EVENT, {
        variables: { id: result.updateEvent.id },
      });
    }
  },

  async deleteEvent(eventId: string) {
    await hygraphMutation(mutations.DELETE_EVENT, {
      variables: { id: eventId },
    });
  },
};

// Export all services
export default {
  userService,
  courseService,
  enrollmentService,
  assignmentService,
  submissionService,
  announcementService,
  eventService,
};
