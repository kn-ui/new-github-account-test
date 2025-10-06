/**
 * GraphQL Queries for Hygraph
 * Organized by domain/collection
 */

// ==================== USER QUERIES ====================

export const GET_USER_BY_UID = `
  query GetUserByUid($uid: String!) {
    user(where: { uid: $uid }) {
      id
      uid
      email
      displayName
      role
      isActive
      passwordChanged
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_BY_EMAIL = `
  query GetUserByEmail($email: String!) {
    user(where: { email: $email }) {
      id
      uid
      email
      displayName
      role
      isActive
      passwordChanged
      createdAt
      updatedAt
    }
  }
`;

export const GET_USERS = `
  query GetUsers($first: Int = 50, $skip: Int = 0) {
    users(
      first: $first
      skip: $skip
      where: { isActive: true }
      orderBy: createdAt_DESC
    ) {
      id
      uid
      email
      displayName
      role
      isActive
      passwordChanged
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEACHERS = `
  query GetTeachers {
    users(where: { role: TEACHER, isActive: true }) {
      id
      uid
      email
      displayName
      role
      createdAt
    }
  }
`;

export const GET_STUDENTS = `
  query GetStudents($first: Int = 100) {
    users(
      where: { role: STUDENT, isActive: true }
      first: $first
    ) {
      id
      uid
      email
      displayName
      role
      createdAt
    }
  }
`;

// ==================== COURSE QUERIES ====================

export const GET_COURSES = `
  query GetCourses($first: Int = 10, $skip: Int = 0) {
    courses(
      first: $first
      skip: $skip
      where: { isActive: true }
      orderBy: createdAt_DESC
    ) {
      id
      title
      description
      category
      duration
      maxStudents
      syllabus
      isActive
      instructorName
      instructor {
        id
        uid
        displayName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_COURSE_BY_ID = `
  query GetCourseById($id: ID!) {
    course(where: { id: $id }) {
      id
      title
      description
      category
      duration
      maxStudents
      syllabus
      isActive
      instructorName
      instructor {
        id
        uid
        displayName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_COURSES_BY_INSTRUCTOR = `
  query GetCoursesByInstructor($instructorUid: String!) {
    courses(
      where: { 
        instructor: { uid: $instructorUid }
        isActive: true
      }
      orderBy: createdAt_DESC
    ) {
      id
      title
      description
      category
      duration
      maxStudents
      instructorName
      createdAt
      updatedAt
    }
  }
`;

// ==================== ENROLLMENT QUERIES ====================

export const GET_ENROLLMENTS_BY_STUDENT = `
  query GetEnrollmentsByStudent($studentUid: String!) {
    enrollments(
      where: { 
        student: { uid: $studentUid }
        isActive: true
      }
      orderBy: enrolledAt_DESC
    ) {
      id
      status
      progress
      completedLessons
      enrolledAt
      lastAccessedAt
      course {
        id
        title
        description
        category
        instructorName
        isActive
      }
    }
  }
`;

export const GET_ENROLLMENTS_BY_COURSE = `
  query GetEnrollmentsByCourse($courseId: ID!) {
    enrollments(
      where: { 
        course: { id: $courseId }
        isActive: true
      }
      orderBy: enrolledAt_DESC
    ) {
      id
      status
      progress
      enrolledAt
      student {
        id
        uid
        displayName
        email
      }
    }
  }
`;

export const GET_ALL_ENROLLMENTS = `
  query GetAllEnrollments($first: Int = 100) {
    enrollments(
      first: $first
      where: { isActive: true }
      orderBy: enrolledAt_DESC
    ) {
      id
      status
      progress
      enrolledAt
      student {
        id
        uid
        displayName
        email
      }
      course {
        id
        title
        category
      }
    }
  }
`;

// ==================== ASSIGNMENT QUERIES ====================

export const GET_ASSIGNMENTS_BY_COURSE = `
  query GetAssignmentsByCourse($courseId: ID!, $first: Int = 50) {
    assignments(
      where: { 
        course: { id: $courseId }
        isActive: true
      }
      first: $first
      orderBy: dueDate_ASC
    ) {
      id
      title
      description
      instructions
      dueDate
      maxScore
      attachments {
        id
        url
        fileName
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ASSIGNMENT_BY_ID = `
  query GetAssignmentById($id: ID!) {
    assignment(where: { id: $id }) {
      id
      title
      description
      instructions
      dueDate
      maxScore
      isActive
      course {
        id
        title
      }
      teacher {
        id
        uid
        displayName
      }
      attachments {
        id
        url
        fileName
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ASSIGNMENTS_BY_TEACHER = `
  query GetAssignmentsByTeacher($teacherUid: String!) {
    assignments(
      where: { 
        teacher: { uid: $teacherUid }
        isActive: true
      }
      orderBy: createdAt_DESC
    ) {
      id
      title
      description
      dueDate
      maxScore
      course {
        id
        title
      }
      createdAt
    }
  }
`;

// ==================== SUBMISSION QUERIES ====================

export const GET_SUBMISSIONS_BY_STUDENT = `
  query GetSubmissionsByStudent($studentUid: String!) {
    submissions(
      where: { 
        student: { uid: $studentUid }
        isActive: true
      }
      orderBy: submittedAt_DESC
    ) {
      id
      content
      status
      grade
      feedback
      maxScore
      submittedAt
      assignment {
        id
        title
        dueDate
        course {
          id
          title
        }
      }
      attachments {
        id
        url
        fileName
      }
    }
  }
`;

export const GET_SUBMISSIONS_BY_ASSIGNMENT = `
  query GetSubmissionsByAssignment($assignmentId: ID!) {
    submissions(
      where: { 
        assignment: { id: $assignmentId }
        isActive: true
      }
      orderBy: submittedAt_DESC
    ) {
      id
      content
      status
      grade
      feedback
      submittedAt
      student {
        id
        uid
        displayName
        email
      }
      attachments {
        id
        url
        fileName
      }
    }
  }
`;

export const GET_SUBMISSION_BY_ID = `
  query GetSubmissionById($id: ID!) {
    submission(where: { id: $id }) {
      id
      content
      status
      grade
      feedback
      maxScore
      submittedAt
      assignment {
        id
        title
        instructions
        maxScore
      }
      student {
        id
        uid
        displayName
        email
      }
      attachments {
        id
        url
        fileName
      }
    }
  }
`;

// ==================== ANNOUNCEMENT QUERIES ====================

export const GET_ANNOUNCEMENTS = `
  query GetAnnouncements($first: Int = 20, $courseId: ID) {
    announcements(
      first: $first
      where: $courseId ? { course: { id: $courseId } } : {}
      orderBy: createdAt_DESC
    ) {
      id
      title
      body
      targetAudience
      externalLink
      recipientStudentId
      createdAt
      author {
        id
        displayName
      }
      course {
        id
        title
      }
    }
  }
`;

export const GET_ANNOUNCEMENTS_FOR_STUDENT = `
  query GetAnnouncementsForStudent($studentUid: String!, $first: Int = 20) {
    announcements(
      first: $first
      orderBy: createdAt_DESC
    ) {
      id
      title
      body
      targetAudience
      externalLink
      recipientStudentId
      createdAt
      author {
        id
        displayName
      }
      course {
        id
        title
      }
    }
  }
`;

// ==================== EVENT QUERIES ====================

export const GET_EVENTS = `
  query GetEvents($first: Int = 10) {
    events(
      first: $first
      where: { isActive: true }
      orderBy: date_ASC
    ) {
      id
      title
      description
      date
      time
      location
      type
      maxAttendees
      currentAttendees
      status
      createdAt
    }
  }
`;

export const GET_EVENT_BY_ID = `
  query GetEventById($id: ID!) {
    event(where: { id: $id }) {
      id
      title
      description
      date
      time
      location
      type
      maxAttendees
      currentAttendees
      status
      isActive
      createdBy
      createdAt
      updatedAt
    }
  }
`;

// ==================== EXAM QUERIES ====================

export const GET_EXAMS_BY_COURSE = `
  query GetExamsByCourse($courseId: ID!) {
    exams(
      where: { course: { id: $courseId } }
      orderBy: date_ASC
    ) {
      id
      title
      description
      date
      startTime
      durationMinutes
      totalPoints
      questions
      firstAttemptTimestamp
      createdAt
      updatedAt
    }
  }
`;

export const GET_EXAM_BY_ID = `
  query GetExamById($id: ID!) {
    exam(where: { id: $id }) {
      id
      title
      description
      date
      startTime
      durationMinutes
      totalPoints
      questions
      firstAttemptTimestamp
      course {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_EXAM_ATTEMPTS_BY_STUDENT = `
  query GetExamAttemptsByStudent($studentUid: String!) {
    examAttempts(
      where: { student: { uid: $studentUid } }
      orderBy: startedAt_DESC
    ) {
      id
      status
      score
      isGraded
      feedback
      startedAt
      submittedAt
      exam {
        id
        title
        totalPoints
        course {
          id
          title
        }
      }
    }
  }
`;

// ==================== GRADE QUERIES ====================

export const GET_GRADES_BY_COURSE = `
  query GetGradesByCourse($courseId: ID!) {
    grades(
      where: { course: { id: $courseId } }
      orderBy: calculatedAt_DESC
    ) {
      id
      finalGrade
      letterGrade
      gradePoints
      calculationMethod
      notes
      calculatedAt
      student {
        id
        uid
        displayName
        email
      }
    }
  }
`;

export const GET_GRADE_BY_STUDENT_AND_COURSE = `
  query GetGradeByStudentAndCourse($studentUid: String!, $courseId: ID!) {
    grades(
      where: { 
        student: { uid: $studentUid }
        course: { id: $courseId }
      }
    ) {
      id
      finalGrade
      letterGrade
      gradePoints
      calculationMethod
      assignmentGrades
      notes
      calculatedAt
    }
  }
`;

// ==================== FORUM QUERIES ====================

export const GET_FORUM_THREADS = `
  query GetForumThreads($first: Int = 10) {
    forumThreads(
      first: $first
      orderBy: lastActivityAt_DESC
    ) {
      id
      title
      body
      category
      likes
      views
      createdAt
      lastActivityAt
      author {
        id
        displayName
      }
    }
  }
`;

export const GET_FORUM_THREAD_BY_ID = `
  query GetForumThreadById($id: ID!) {
    forumThread(where: { id: $id }) {
      id
      title
      body
      category
      likes
      views
      createdAt
      lastActivityAt
      author {
        id
        uid
        displayName
      }
      posts {
        id
        body
        likes
        createdAt
        author {
          id
          displayName
        }
      }
    }
  }
`;

// ==================== BLOG QUERIES ====================

export const GET_BLOG_POSTS = `
  query GetBlogPosts($first: Int = 10) {
    blogPosts(
      first: $first
      orderBy: createdAt_DESC
    ) {
      id
      title
      content
      likes
      createdAt
      author {
        id
        displayName
      }
    }
  }
`;

// ==================== SUPPORT TICKET QUERIES ====================

export const GET_SUPPORT_TICKETS = `
  query GetSupportTickets($first: Int = 100) {
    supportTickets(
      first: $first
      orderBy: createdAt_DESC
    ) {
      id
      name
      email
      subject
      message
      status
      createdAt
      user {
        id
        displayName
      }
    }
  }
`;

export const GET_SUPPORT_TICKETS_BY_USER = `
  query GetSupportTicketsByUser($userUid: String!) {
    supportTickets(
      where: { user: { uid: $userUid } }
      orderBy: createdAt_DESC
    ) {
      id
      name
      email
      subject
      message
      status
      createdAt
    }
  }
`;

// ==================== COURSE MATERIAL QUERIES ====================

export const GET_COURSE_MATERIALS_BY_COURSE = `
  query GetCourseMaterialsByCourse($courseId: ID!, $first: Int = 50) {
    courseMaterials(
      where: { 
        course: { id: $courseId }
        isActive: true
      }
      first: $first
      orderBy: createdAt_DESC
    ) {
      id
      title
      description
      type
      externalLink
      file {
        id
        url
        fileName
      }
      createdAt
      updatedAt
    }
  }
`;

// ==================== CERTIFICATE QUERIES ====================

export const GET_CERTIFICATES_FOR_USER = `
  query GetCertificatesForUser($userUid: String!) {
    certificates(
      where: { user: { uid: $userUid } }
      orderBy: awardedAt_DESC
    ) {
      id
      type
      period
      details
      awardedAt
    }
  }
`;
