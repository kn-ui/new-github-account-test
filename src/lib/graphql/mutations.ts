/**
 * GraphQL Mutations for Hygraph
 * Organized by domain/collection
 */

// ==================== USER MUTATIONS ====================

export const CREATE_USER = `
  mutation CreateUser($data: UserCreateInput!) {
    createUser(data: $data) {
      id
      uid
      email
      displayName
      role
      isActive
      passwordChanged
      createdAt
    }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($uid: String!, $data: UserUpdateInput!) {
    updateUser(where: { uid: $uid }, data: $data) {
      id
      uid
      email
      displayName
      role
      isActive
      passwordChanged
      updatedAt
    }
  }
`;

export const DELETE_USER = `
  mutation DeleteUser($uid: String!) {
    updateUser(
      where: { uid: $uid }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_USER = `
  mutation PublishUser($id: ID!) {
    publishUser(where: { id: $id }) {
      id
    }
  }
`;

// ==================== COURSE MUTATIONS ====================

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
      updatedAt
    }
  }
`;

export const DELETE_COURSE = `
  mutation DeleteCourse($id: ID!) {
    updateCourse(
      where: { id: $id }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_COURSE = `
  mutation PublishCourse($id: ID!) {
    publishCourse(where: { id: $id }) {
      id
    }
  }
`;

// ==================== ENROLLMENT MUTATIONS ====================

export const CREATE_ENROLLMENT = `
  mutation CreateEnrollment($data: EnrollmentCreateInput!) {
    createEnrollment(data: $data) {
      id
      status
      progress
      enrolledAt
    }
  }
`;

export const UPDATE_ENROLLMENT = `
  mutation UpdateEnrollment($id: ID!, $data: EnrollmentUpdateInput!) {
    updateEnrollment(where: { id: $id }, data: $data) {
      id
      status
      progress
      completedLessons
      lastAccessedAt
    }
  }
`;

export const DELETE_ENROLLMENT = `
  mutation DeleteEnrollment($id: ID!) {
    updateEnrollment(
      where: { id: $id }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_ENROLLMENT = `
  mutation PublishEnrollment($id: ID!) {
    publishEnrollment(where: { id: $id }) {
      id
    }
  }
`;

// ==================== ASSIGNMENT MUTATIONS ====================

export const CREATE_ASSIGNMENT = `
  mutation CreateAssignment($data: AssignmentCreateInput!) {
    createAssignment(data: $data) {
      id
      title
      description
      dueDate
      maxScore
      createdAt
    }
  }
`;

export const UPDATE_ASSIGNMENT = `
  mutation UpdateAssignment($id: ID!, $data: AssignmentUpdateInput!) {
    updateAssignment(where: { id: $id }, data: $data) {
      id
      title
      description
      dueDate
      maxScore
      updatedAt
    }
  }
`;

export const DELETE_ASSIGNMENT = `
  mutation DeleteAssignment($id: ID!) {
    updateAssignment(
      where: { id: $id }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_ASSIGNMENT = `
  mutation PublishAssignment($id: ID!) {
    publishAssignment(where: { id: $id }) {
      id
    }
  }
`;

// ==================== SUBMISSION MUTATIONS ====================

export const CREATE_SUBMISSION = `
  mutation CreateSubmission($data: SubmissionCreateInput!) {
    createSubmission(data: $data) {
      id
      content
      status
      submittedAt
    }
  }
`;

export const UPDATE_SUBMISSION = `
  mutation UpdateSubmission($id: ID!, $data: SubmissionUpdateInput!) {
    updateSubmission(where: { id: $id }, data: $data) {
      id
      content
      status
      grade
      feedback
      updatedAt
    }
  }
`;

export const GRADE_SUBMISSION = `
  mutation GradeSubmission($id: ID!, $grade: Int!, $feedback: String) {
    updateSubmission(
      where: { id: $id }
      data: { 
        grade: $grade
        feedback: $feedback
        status: GRADED
      }
    ) {
      id
      grade
      feedback
      status
    }
  }
`;

export const PUBLISH_SUBMISSION = `
  mutation PublishSubmission($id: ID!) {
    publishSubmission(where: { id: $id }) {
      id
    }
  }
`;

// ==================== ANNOUNCEMENT MUTATIONS ====================

export const CREATE_ANNOUNCEMENT = `
  mutation CreateAnnouncement($data: AnnouncementCreateInput!) {
    createAnnouncement(data: $data) {
      id
      title
      body
      targetAudience
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

export const PUBLISH_ANNOUNCEMENT = `
  mutation PublishAnnouncement($id: ID!) {
    publishAnnouncement(where: { id: $id }) {
      id
    }
  }
`;

// ==================== EVENT MUTATIONS ====================

export const CREATE_EVENT = `
  mutation CreateEvent($data: EventCreateInput!) {
    createEvent(data: $data) {
      id
      title
      description
      date
      time
      location
      status
      createdAt
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
      status
      updatedAt
    }
  }
`;

export const DELETE_EVENT = `
  mutation DeleteEvent($id: ID!) {
    updateEvent(
      where: { id: $id }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_EVENT = `
  mutation PublishEvent($id: ID!) {
    publishEvent(where: { id: $id }) {
      id
    }
  }
`;

// ==================== EXAM MUTATIONS ====================

export const CREATE_EXAM = `
  mutation CreateExam($data: ExamCreateInput!) {
    createExam(data: $data) {
      id
      title
      description
      date
      totalPoints
      createdAt
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
      totalPoints
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

export const PUBLISH_EXAM = `
  mutation PublishExam($id: ID!) {
    publishExam(where: { id: $id }) {
      id
    }
  }
`;

// ==================== EXAM ATTEMPT MUTATIONS ====================

export const CREATE_EXAM_ATTEMPT = `
  mutation CreateExamAttempt($data: ExamAttemptCreateInput!) {
    createExamAttempt(data: $data) {
      id
      status
      startedAt
    }
  }
`;

export const UPDATE_EXAM_ATTEMPT = `
  mutation UpdateExamAttempt($id: ID!, $data: ExamAttemptUpdateInput!) {
    updateExamAttempt(where: { id: $id }, data: $data) {
      id
      status
      score
      isGraded
      updatedAt
    }
  }
`;

export const SUBMIT_EXAM_ATTEMPT = `
  mutation SubmitExamAttempt($id: ID!, $answers: Json!) {
    updateExamAttempt(
      where: { id: $id }
      data: { 
        answers: $answers
        status: SUBMITTED
        submittedAt: "${new Date().toISOString()}"
      }
    ) {
      id
      status
      submittedAt
    }
  }
`;

export const GRADE_EXAM_ATTEMPT = `
  mutation GradeExamAttempt($id: ID!, $score: Int!, $feedback: String) {
    updateExamAttempt(
      where: { id: $id }
      data: { 
        score: $score
        feedback: $feedback
        status: GRADED
        isGraded: true
      }
    ) {
      id
      score
      feedback
      status
      isGraded
    }
  }
`;

export const PUBLISH_EXAM_ATTEMPT = `
  mutation PublishExamAttempt($id: ID!) {
    publishExamAttempt(where: { id: $id }) {
      id
    }
  }
`;

// ==================== GRADE MUTATIONS ====================

export const CREATE_GRADE = `
  mutation CreateGrade($data: GradeCreateInput!) {
    createGrade(data: $data) {
      id
      finalGrade
      letterGrade
      gradePoints
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
      calculatedAt
    }
  }
`;

export const DELETE_GRADE = `
  mutation DeleteGrade($id: ID!) {
    deleteGrade(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_GRADE = `
  mutation PublishGrade($id: ID!) {
    publishGrade(where: { id: $id }) {
      id
    }
  }
`;

// ==================== FORUM MUTATIONS ====================

export const CREATE_FORUM_THREAD = `
  mutation CreateForumThread($data: ForumThreadCreateInput!) {
    createForumThread(data: $data) {
      id
      title
      body
      createdAt
      lastActivityAt
    }
  }
`;

export const CREATE_FORUM_POST = `
  mutation CreateForumPost($data: ForumPostCreateInput!) {
    createForumPost(data: $data) {
      id
      body
      createdAt
    }
  }
`;

export const UPDATE_FORUM_THREAD = `
  mutation UpdateForumThread($id: ID!, $data: ForumThreadUpdateInput!) {
    updateForumThread(where: { id: $id }, data: $data) {
      id
      title
      body
      updatedAt
    }
  }
`;

export const DELETE_FORUM_THREAD = `
  mutation DeleteForumThread($id: ID!) {
    deleteForumThread(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_FORUM_THREAD = `
  mutation PublishForumThread($id: ID!) {
    publishForumThread(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_FORUM_POST = `
  mutation PublishForumPost($id: ID!) {
    publishForumPost(where: { id: $id }) {
      id
    }
  }
`;

// ==================== BLOG MUTATIONS ====================

export const CREATE_BLOG_POST = `
  mutation CreateBlogPost($data: BlogPostCreateInput!) {
    createBlogPost(data: $data) {
      id
      title
      content
      likes
      createdAt
    }
  }
`;

export const UPDATE_BLOG_POST = `
  mutation UpdateBlogPost($id: ID!, $data: BlogPostUpdateInput!) {
    updateBlogPost(where: { id: $id }, data: $data) {
      id
      title
      content
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

export const PUBLISH_BLOG_POST = `
  mutation PublishBlogPost($id: ID!) {
    publishBlogPost(where: { id: $id }) {
      id
    }
  }
`;

// ==================== SUPPORT TICKET MUTATIONS ====================

export const CREATE_SUPPORT_TICKET = `
  mutation CreateSupportTicket($data: SupportTicketCreateInput!) {
    createSupportTicket(data: $data) {
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

export const UPDATE_SUPPORT_TICKET = `
  mutation UpdateSupportTicket($id: ID!, $data: SupportTicketUpdateInput!) {
    updateSupportTicket(where: { id: $id }, data: $data) {
      id
      status
      updatedAt
    }
  }
`;

export const DELETE_SUPPORT_TICKET = `
  mutation DeleteSupportTicket($id: ID!) {
    deleteSupportTicket(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_SUPPORT_TICKET = `
  mutation PublishSupportTicket($id: ID!) {
    publishSupportTicket(where: { id: $id }) {
      id
    }
  }
`;

// ==================== COURSE MATERIAL MUTATIONS ====================

export const CREATE_COURSE_MATERIAL = `
  mutation CreateCourseMaterial($data: CourseMaterialCreateInput!) {
    createCourseMaterial(data: $data) {
      id
      title
      description
      type
      createdAt
    }
  }
`;

export const UPDATE_COURSE_MATERIAL = `
  mutation UpdateCourseMaterial($id: ID!, $data: CourseMaterialUpdateInput!) {
    updateCourseMaterial(where: { id: $id }, data: $data) {
      id
      title
      description
      updatedAt
    }
  }
`;

export const DELETE_COURSE_MATERIAL = `
  mutation DeleteCourseMaterial($id: ID!) {
    updateCourseMaterial(
      where: { id: $id }
      data: { isActive: false }
    ) {
      id
      isActive
    }
  }
`;

export const PUBLISH_COURSE_MATERIAL = `
  mutation PublishCourseMaterial($id: ID!) {
    publishCourseMaterial(where: { id: $id }) {
      id
    }
  }
`;

// ==================== CERTIFICATE MUTATIONS ====================

export const CREATE_CERTIFICATE = `
  mutation CreateCertificate($data: CertificateCreateInput!) {
    createCertificate(data: $data) {
      id
      type
      awardedAt
    }
  }
`;

export const DELETE_CERTIFICATE = `
  mutation DeleteCertificate($id: ID!) {
    deleteCertificate(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_CERTIFICATE = `
  mutation PublishCertificate($id: ID!) {
    publishCertificate(where: { id: $id }) {
      id
    }
  }
`;

// ==================== ACTIVITY LOG MUTATIONS ====================

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

export const PUBLISH_ACTIVITY_LOG = `
  mutation PublishActivityLog($id: ID!) {
    publishActivityLog(where: { id: $id }) {
      id
    }
  }
`;
