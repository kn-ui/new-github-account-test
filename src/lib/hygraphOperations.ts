// GraphQL Operations for Hygraph
// This file contains all queries and mutations for the school management system

// ===== USER OPERATIONS =====
export const GET_USERS = `
  query GetUsers($first: Int, $skip: Int, $where: AppUserWhereInput) {
    appUsers(first: $first, skip: $skip, where: $where) {
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

export const GET_USER_BY_ID = `
  query GetUserById($id: ID!) {
    appUser(where: { id: $id }) {
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

export const GET_USER_BY_UID = `
  query GetUserByUid($uid: String!) {
    appUser(where: { uid: $uid }) {
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
    appUser(where: { email: $email }) {
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

export const CREATE_USER = `
  mutation CreateUser($data: AppUserCreateInput!) {
    createAppUser(data: $data) {
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

export const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $data: AppUserUpdateInput!) {
    updateAppUser(where: { id: $id }, data: $data) {
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

export const DELETE_USER = `
  mutation DeleteUser($id: ID!) {
    deleteAppUser(where: { id: $id }) {
      id
    }
  }
`;

// ===== COURSE OPERATIONS =====
export const GET_COURSES = `
  query GetCourses($first: Int, $skip: Int, $where: CourseWhereInput) {
    courses(first: $first, skip: $skip, where: $where) {
      id
      title
      description
      category
      duration
      maxStudents
      syllabus
      isActive
      instructorName
      createdAt
      updatedAt
      instructor {
        id
        displayName
        email
      }
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
      createdAt
      updatedAt
      instructor {
        id
        displayName
        email
      }
      enrollments {
        id
        enrollmentStatus
        progress
        enrolledAt
        student {
          id
          displayName
          email
        }
      }
      assignments {
        id
        title
        description
        dueDate
        maxScore
        isActive
      }
      materials {
        id
        title
        description
        type
        externalLink
        isActive
      }
      exams {
        id
        title
        description
        date
        durationMinutes
        totalPoints
      }
    }
  }
`;

export const CREATE_COURSE = `
  mutation CreateCourse($data: CourseCreateInput!) {
    createCourse(data: $data) {
      id
      title
      description
      category
      duration
      maxStudents
      syllabus
      isActive
      instructorName
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_COURSE = `
  mutation UpdateCourse($id: ID!, $data: CourseUpdateInput!) {
    updateCourse(where: { id: $id }, data: $data) {
      id
      title
      description
      category
      duration
      maxStudents
      syllabus
      isActive
      instructorName
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_COURSE = `
  mutation DeleteCourse($id: ID!) {
    deleteCourse(where: { id: $id }) {
      id
    }
  }
`;

// ===== ENROLLMENT OPERATIONS =====
export const GET_ENROLLMENTS = `
  query GetEnrollments($first: Int, $skip: Int, $where: EnrollmentWhereInput) {
    enrollments(first: $first, skip: $skip, where: $where) {
      id
      enrollmentStatus
      progress
      completedLessons
      isActive
      enrolledAt
      lastAccessedAt
      student {
        id
        displayName
        email
      }
      course {
        id
        title
        description
      }
    }
  }
`;

export const CREATE_ENROLLMENT = `
  mutation CreateEnrollment($data: EnrollmentCreateInput!) {
    createEnrollment(data: $data) {
      id
      enrollmentStatus
      progress
      completedLessons
      isActive
      enrolledAt
      lastAccessedAt
    }
  }
`;

export const UPDATE_ENROLLMENT = `
  mutation UpdateEnrollment($id: ID!, $data: EnrollmentUpdateInput!) {
    updateEnrollment(where: { id: $id }, data: $data) {
      id
      enrollmentStatus
      progress
      completedLessons
      isActive
      enrolledAt
      lastAccessedAt
    }
  }
`;

// ===== ASSIGNMENT OPERATIONS =====
export const GET_ASSIGNMENTS = `
  query GetAssignments($first: Int, $skip: Int, $where: AssignmentWhereInput) {
    assignments(first: $first, skip: $skip, where: $where) {
      id
      title
      description
      instructions
      dueDate
      maxScore
      isActive
      createdAt
      updatedAt
      course {
        id
        title
      }
      teacher {
        id
        displayName
      }
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
      createdAt
      updatedAt
      course {
        id
        title
        description
      }
      teacher {
        id
        displayName
        email
      }
      submissions {
        id
        content
        submissionStatus
        grade
        feedback
        submittedAt
        student {
          id
          displayName
          email
        }
      }
    }
  }
`;

export const CREATE_ASSIGNMENT = `
  mutation CreateAssignment($data: AssignmentCreateInput!) {
    createAssignment(data: $data) {
      id
      title
      description
      instructions
      dueDate
      maxScore
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ASSIGNMENT = `
  mutation UpdateAssignment($id: ID!, $data: AssignmentUpdateInput!) {
    updateAssignment(where: { id: $id }, data: $data) {
      id
      title
      description
      instructions
      dueDate
      maxScore
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ASSIGNMENT = `
  mutation DeleteAssignment($id: ID!) {
    deleteAssignment(where: { id: $id }) {
      id
    }
  }
`;

// ===== SUBMISSION OPERATIONS =====
export const GET_SUBMISSIONS = `
  query GetSubmissions($first: Int, $skip: Int, $where: SubmissionWhereInput) {
    submissions(first: $first, skip: $skip, where: $where) {
      id
      content
      submissionStatus
      grade
      feedback
      maxScore
      isActive
      submittedAt
      updatedAt
      student {
        id
        displayName
        email
      }
      assignment {
        id
        title
        description
      }
      course {
        id
        title
      }
    }
  }
`;

export const GET_SUBMISSION_BY_ID = `
  query GetSubmissionById($id: ID!) {
    submission(where: { id: $id }) {
      id
      content
      submissionStatus
      grade
      feedback
      maxScore
      isActive
      submittedAt
      updatedAt
      student {
        id
        displayName
        email
      }
      assignment {
        id
        title
        description
        instructions
        dueDate
        maxScore
      }
      course {
        id
        title
        description
      }
    }
  }
`;

export const CREATE_SUBMISSION = `
  mutation CreateSubmission($data: SubmissionCreateInput!) {
    createSubmission(data: $data) {
      id
      content
      submissionStatus
      grade
      feedback
      maxScore
      isActive
      submittedAt
      updatedAt
    }
  }
`;

export const UPDATE_SUBMISSION = `
  mutation UpdateSubmission($id: ID!, $data: SubmissionUpdateInput!) {
    updateSubmission(where: { id: $id }, data: $data) {
      id
      content
      submissionStatus
      grade
      feedback
      maxScore
      isActive
      submittedAt
      updatedAt
    }
  }
`;

// ===== EXAM OPERATIONS =====
export const GET_EXAMS = `
  query GetExams($first: Int, $skip: Int, $where: ExamWhereInput) {
    exams(first: $first, skip: $skip, where: $where) {
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
      course {
        id
        title
      }
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
      createdAt
      updatedAt
      course {
        id
        title
        description
      }
      attempts {
        id
        examAttemptStatus
        answers
        autoScore
        manualScore
        score
        feedback
        isGraded
        startedAt
        submittedAt
        student {
          id
          displayName
          email
        }
      }
    }
  }
`;

export const CREATE_EXAM = `
  mutation CreateExam($data: ExamCreateInput!) {
    createExam(data: $data) {
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

export const UPDATE_EXAM = `
  mutation UpdateExam($id: ID!, $data: ExamUpdateInput!) {
    updateExam(where: { id: $id }, data: $data) {
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

export const DELETE_EXAM = `
  mutation DeleteExam($id: ID!) {
    deleteExam(where: { id: $id }) {
      id
    }
  }
`;

// ===== EXAM ATTEMPT OPERATIONS =====
export const GET_EXAM_ATTEMPTS = `
  query GetExamAttempts($first: Int, $skip: Int, $where: ExamAttemptWhereInput) {
    examAttempts(first: $first, skip: $skip, where: $where) {
      id
      examAttemptStatus
      answers
      autoScore
      totalAutoPoints
      manualScore
      score
      feedback
      isGraded
      startedAt
      submittedAt
      updatedAt
      student {
        id
        displayName
        email
      }
      exam {
        id
        title
        description
      }
    }
  }
`;

export const CREATE_EXAM_ATTEMPT = `
  mutation CreateExamAttempt($data: ExamAttemptCreateInput!) {
    createExamAttempt(data: $data) {
      id
      examAttemptStatus
      answers
      autoScore
      totalAutoPoints
      manualScore
      score
      feedback
      isGraded
      startedAt
      submittedAt
      updatedAt
    }
  }
`;

export const UPDATE_EXAM_ATTEMPT = `
  mutation UpdateExamAttempt($id: ID!, $data: ExamAttemptUpdateInput!) {
    updateExamAttempt(where: { id: $id }, data: $data) {
      id
      examAttemptStatus
      answers
      autoScore
      totalAutoPoints
      manualScore
      score
      feedback
      isGraded
      startedAt
      submittedAt
      updatedAt
    }
  }
`;

// ===== ANNOUNCEMENT OPERATIONS =====
export const GET_ANNOUNCEMENTS = `
  query GetAnnouncements($first: Int, $skip: Int, $where: AnnouncementWhereInput) {
    announcements(first: $first, skip: $skip, where: $where) {
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

export const CREATE_ANNOUNCEMENT = `
  mutation CreateAnnouncement($data: AnnouncementCreateInput!) {
    createAnnouncement(data: $data) {
      id
      title
      body
      targetAudience
      externalLink
      recipientStudentId
      createdAt
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = `
  mutation UpdateAnnouncement($id: ID!, $data: AnnouncementUpdateInput!) {
    updateAnnouncement(where: { id: $id }, data: $data) {
      id
      title
      body
      targetAudience
      externalLink
      recipientStudentId
      createdAt
    }
  }
`;

export const DELETE_ANNOUNCEMENT = `
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(where: { id: $id }) {
      id
    }
  }
`;

// ===== EVENT OPERATIONS =====
export const GET_EVENTS = `
  query GetEvents($first: Int, $skip: Int, $where: EventWhereInput) {
    events(first: $first, skip: $skip, where: $where) {
      id
      title
      description
      date
      time
      location
      type
      maxAttendees
      currentAttendees
      eventStatus
      isActive
      eventCreator
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_EVENT = `
  mutation CreateEvent($data: EventCreateInput!) {
    createEvent(data: $data) {
      id
      title
      description
      date
      time
      location
      type
      maxAttendees
      currentAttendees
      eventStatus
      isActive
      eventCreator
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_EVENT = `
  mutation UpdateEvent($id: ID!, $data: EventUpdateInput!) {
    updateEvent(where: { id: $id }, data: $data) {
      id
      title
      description
      date
      time
      location
      type
      maxAttendees
      currentAttendees
      eventStatus
      isActive
      eventCreator
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_EVENT = `
  mutation DeleteEvent($id: ID!) {
    deleteEvent(where: { id: $id }) {
      id
    }
  }
`;

// ===== GRADE OPERATIONS =====
export const GET_GRADES = `
  query GetGrades($first: Int, $skip: Int, $where: GradeWhereInput) {
    grades(first: $first, skip: $skip, where: $where) {
      id
      finalGrade
      letterGrade
      gradePoints
      calculationMethod
      assignmentGrades
      notes
      calculatedBy
      calculatedAt
      student {
        id
        displayName
        email
      }
      course {
        id
        title
      }
    }
  }
`;

export const CREATE_GRADE = `
  mutation CreateGrade($data: GradeCreateInput!) {
    createGrade(data: $data) {
      id
      finalGrade
      letterGrade
      gradePoints
      calculationMethod
      assignmentGrades
      notes
      calculatedBy
      calculatedAt
    }
  }
`;

export const UPDATE_GRADE = `
  mutation UpdateGrade($id: ID!, $data: GradeUpdateInput!) {
    updateGrade(where: { id: $id }, data: $data) {
      id
      finalGrade
      letterGrade
      gradePoints
      calculationMethod
      assignmentGrades
      notes
      calculatedBy
      calculatedAt
    }
  }
`;

// ===== COURSE MATERIAL OPERATIONS =====
export const GET_COURSE_MATERIALS = `
  query GetCourseMaterials($first: Int, $skip: Int, $where: CourseMaterialWhereInput) {
    courseMaterials(first: $first, skip: $skip, where: $where) {
      id
      title
      description
      type
      externalLink
      isActive
      createdAt
      updatedAt
      course {
        id
        title
      }
    }
  }
`;

export const CREATE_COURSE_MATERIAL = `
  mutation CreateCourseMaterial($data: CourseMaterialCreateInput!) {
    createCourseMaterial(data: $data) {
      id
      title
      description
      type
      externalLink
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_COURSE_MATERIAL = `
  mutation UpdateCourseMaterial($id: ID!, $data: CourseMaterialUpdateInput!) {
    updateCourseMaterial(where: { id: $id }, data: $data) {
      id
      title
      description
      type
      externalLink
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_COURSE_MATERIAL = `
  mutation DeleteCourseMaterial($id: ID!) {
    deleteCourseMaterial(where: { id: $id }) {
      id
    }
  }
`;

// ===== SUPPORT TICKET OPERATIONS =====
export const GET_SUPPORT_TICKETS = `
  query GetSupportTickets($first: Int, $skip: Int, $where: SupportTicketWhereInput) {
    supportTickets(first: $first, skip: $skip, where: $where) {
      id
      name
      email
      subject
      message
      supportTicketStatus
      createdAt
      updatedAt
      user {
        id
        displayName
        email
      }
    }
  }
`;

export const CREATE_SUPPORT_TICKET = `
  mutation CreateSupportTicket($data: SupportTicketCreateInput!) {
    createSupportTicket(data: $data) {
      id
      name
      email
      subject
      message
      supportTicketStatus
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SUPPORT_TICKET = `
  mutation UpdateSupportTicket($id: ID!, $data: SupportTicketUpdateInput!) {
    updateSupportTicket(where: { id: $id }, data: $data) {
      id
      name
      email
      subject
      message
      supportTicketStatus
      createdAt
      updatedAt
    }
  }
`;

// ===== EDIT REQUEST OPERATIONS =====
export const GET_EDIT_REQUESTS = `
  query GetEditRequests($first: Int, $skip: Int, $where: EditRequestWhereInput) {
    editRequests(first: $first, skip: $skip, where: $where) {
      id
      submissionId
      assignmentId
      assignmentTitle
      courseId
      courseTitle
      studentId
      studentName
      studentEmail
      teacherId
      reason
      status
      response
      respondedBy
      isActive
      requestedAt
      respondedAt
    }
  }
`;

export const CREATE_EDIT_REQUEST = `
  mutation CreateEditRequest($data: EditRequestCreateInput!) {
    createEditRequest(data: $data) {
      id
      submissionId
      assignmentId
      assignmentTitle
      courseId
      courseTitle
      studentId
      studentName
      studentEmail
      teacherId
      reason
      status
      response
      respondedBy
      isActive
      requestedAt
      respondedAt
    }
  }
`;

export const UPDATE_EDIT_REQUEST = `
  mutation UpdateEditRequest($id: ID!, $data: EditRequestUpdateInput!) {
    updateEditRequest(where: { id: $id }, data: $data) {
      id
      submissionId
      assignmentId
      assignmentTitle
      courseId
      courseTitle
      studentId
      studentName
      studentEmail
      teacherId
      reason
      status
      response
      respondedBy
      isActive
      requestedAt
      respondedAt
    }
  }
`;

// ===== FORUM OPERATIONS =====
export const GET_FORUM_THREADS = `
  query GetForumThreads($first: Int, $skip: Int, $where: ForumThreadWhereInput) {
    forumThreads(first: $first, skip: $skip, where: $where) {
      id
      title
      body
      category
      likes
      views
      createdAt
      lastActivityAt
      updatedAt
      author {
        id
        displayName
      }
      posts {
        id
        body
        likes
        dateCreated
        author {
          id
          displayName
        }
      }
    }
  }
`;

export const CREATE_FORUM_THREAD = `
  mutation CreateForumThread($data: ForumThreadCreateInput!) {
    createForumThread(data: $data) {
      id
      title
      body
      category
      likes
      views
      createdAt
      lastActivityAt
      updatedAt
    }
  }
`;

export const GET_FORUM_POSTS = `
  query GetForumPosts($first: Int, $skip: Int, $where: ForumPostWhereInput) {
    forumPosts(first: $first, skip: $skip, where: $where) {
      id
      body
      likes
      dateCreated
      author {
        id
        displayName
      }
      thread {
        id
        title
      }
    }
  }
`;

export const CREATE_FORUM_POST = `
  mutation CreateForumPost($data: ForumPostCreateInput!) {
    createForumPost(data: $data) {
      id
      body
      likes
      dateCreated
    }
  }
`;

// ===== BLOG OPERATIONS =====
export const GET_BLOG_POSTS = `
  query GetBlogPosts($first: Int, $skip: Int, $where: BlogPostWhereInput) {
    blogPosts(first: $first, skip: $skip, where: $where) {
      id
      title
      content
      likes
      createdAt
      updatedAt
      author {
        id
        displayName
      }
    }
  }
`;

export const CREATE_BLOG_POST = `
  mutation CreateBlogPost($data: BlogPostCreateInput!) {
    createBlogPost(data: $data) {
      id
      title
      content
      likes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BLOG_POST = `
  mutation UpdateBlogPost($id: ID!, $data: BlogPostUpdateInput!) {
    updateBlogPost(where: { id: $id }, data: $data) {
      id
      title
      content
      likes
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BLOG_POST = `
  mutation DeleteBlogPost($id: ID!) {
    deleteBlogPost(where: { id: $id }) {
      id
    }
  }
`;

// ===== CERTIFICATE OPERATIONS =====
export const GET_CERTIFICATES = `
  query GetCertificates($first: Int, $skip: Int, $where: CertificateWhereInput) {
    certificates(first: $first, skip: $skip, where: $where) {
      id
      type
      period
      details
      awardedAt
      user {
        id
        displayName
        email
      }
    }
  }
`;

export const CREATE_CERTIFICATE = `
  mutation CreateCertificate($data: CertificateCreateInput!) {
    createCertificate(data: $data) {
      id
      type
      period
      details
      awardedAt
    }
  }
`;

// ===== ACTIVITY LOG OPERATIONS =====
export const GET_ACTIVITY_LOGS = `
  query GetActivityLogs($first: Int, $skip: Int, $where: ActivityLogWhereInput) {
    activityLogs(first: $first, skip: $skip, where: $where) {
      id
      dateKey
      source
      createdAt
      user {
        id
        displayName
      }
    }
  }
`;

export const CREATE_ACTIVITY_LOG = `
  mutation CreateActivityLog($data: ActivityLogCreateInput!) {
    createActivityLog(data: $data) {
      id
      dateKey
      source
      createdAt
    }
  }
`;