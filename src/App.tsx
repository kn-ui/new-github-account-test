import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardWrapper from "./components/DashboardWrapper";
import CourseDetail from "./pages/CourseDetail";
import CreateCourse from "./pages/CreateCourse";
import UserManager from "./pages/UserManager";
import CourseManager from "./pages/CourseManager";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Academic from "./pages/Academic";
import Admissions from "./pages/Admissions";
import Calendar from "./pages/Calendar";
import Rules from "./pages/Rules";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Updates from "./pages/Updates";
import Contact from "./pages/Contact";
import Forum from "./pages/Forum";
import ForumThread from "./pages/ForumThread";
// Dev utilities removed for production cleanup

import Events from "./pages/Events";
import Students from "./pages/Students";
import Submissions from "./pages/Submissions";
import TeacherReports from "./pages/TeacherReports";
import Certificates from "./pages/Certificates";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherAnnouncements from "./pages/TeacherAnnouncements";
import TeacherCourseMaterials from "./pages/TeacherCourseMaterials";
import StudentAssignments from "./pages/StudentAssignments";
import StudentAnnouncements from "./pages/StudentAnnouncements";
import StudentSubmissions from "./pages/StudentSubmissions";
import StudentProgress from "./pages/StudentProgress";
import AdminReports from "./pages/AdminReports";
import AssignmentEditRequests from "./pages/AssignmentEditRequests";
import AdminSettings from "./pages/AdminSettings";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminStudentGrades from "./pages/AdminStudentGrades";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherCourseDetail from "./pages/TeacherCourseDetail";
import StudentCourses from "./pages/StudentCourses";
import TeacherGrades from "./pages/TeacherGrades";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import StudentGrades from "./pages/StudentGrades";
import StudentExams from "./pages/StudentExams";
import TakeExam from "./pages/TakeExam";
import StudentExamResult from "./pages/StudentExamResult";
import ExamQuestions from "./pages/ExamQuestions";
import ExamResults from "./pages/ExamResults";
import SearchResults from "./pages/SearchResults";
import SeedDatabase from "./pages/SeedDatabase";
import SubmissionDetail from "./pages/SubmissionDetail";
import AssignmentSubmissions from "./pages/AssignmentSubmissions";
import TeacherAttendance from "./pages/TeacherAttendance";
import AdminAttendance from "./pages/AdminAttendance";
import ManageAdmins from "./pages/ManageAdmins";

// import Catalog from "./pages/Catalog";

const queryClient = new QueryClient();

import SuperAdminRoute from "./pages/SuperAdminRoutes";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/academic" element={<Academic />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/admission" element={<Admissions />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:blogId" element={<BlogDetail />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:threadId" element={<ForumThread />} />
            {/* Public events page */}
            <Route path="/events" element={<Events />} />
            {/* <Route path="/catalog" element={<Catalog />} /> */}
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route 
              path="/dashboard/course/:courseId" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <CourseDetail />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manage-admins" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <ManageAdmins />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route path="/seed" element={<SeedDatabase />} />
            <Route
              path="/dashboard/submissions/:submissionId"
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <SubmissionDetail />
                  </DashboardWrapper>
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard/submissions/:assignmentId/submissions" element={<ProtectedRoute><DashboardWrapper><AssignmentSubmissions /></DashboardWrapper></ProtectedRoute>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/search" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <SearchResults />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            
            {/* Dashboard Sub-routes */}
            <Route 
              path="/dashboard/users" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <SuperAdminRoute page="users" />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/courses" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <SuperAdminRoute page="courses" />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/events" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <SuperAdminRoute page="events" />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard/reports" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AdminReports />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/assignment-edit-requests" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AssignmentEditRequests />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AdminSettings />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin-announcements" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AdminAnnouncements />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin-attendance" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AdminAttendance />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin-student-grades/:studentId" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <Suspense fallback={
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div>
                              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center py-12">
                          <LoadingSpinner size="lg" />
                        </div>
                      </div>
                    }>
                      <AdminStudentGrades />
                    </Suspense>
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            
            {/* Teacher Dashboard Routes */}
            <Route 
              path="/dashboard/students" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <Students />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/assignments" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherAssignments />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/submissions" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <Submissions />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/announcements" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherAnnouncements />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/materials" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherCourseMaterials />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/attendance" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherAttendance />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/teacher-reports" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherReports />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            
            {/* Student Dashboard Routes */}
            <Route 
              path="/dashboard/student-assignments" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentAssignments />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-submissions" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentSubmissions />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/certificates" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <Certificates />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-announcements" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentAnnouncements />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-exams" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentExams />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-exams/:examId" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TakeExam />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-exams/:examId/result" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentExamResult />
                  </DashboardWrapper>
                </ProtectedRoute>
              }
            />
        <Route
          path="/dashboard/exam-questions/:examId"
          element={
            <ProtectedRoute>
              <DashboardWrapper>
                <ExamQuestions />
              </DashboardWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/exam-results/:examId"
          element={
            <ProtectedRoute>
              <DashboardWrapper>
                <ExamResults />
              </DashboardWrapper>
            </ProtectedRoute>
          }
        />
            <Route 
              path="/dashboard/progress" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentProgress />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/my-courses" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherCourses />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/my-courses/:courseId" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherCourseDetail />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-courses" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentCourses />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-grades" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentGrades />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student-submissions/:assignmentId/:action" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <StudentSubmissions />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/teacher-grades" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherGrades />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/teacher-analytics" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <TeacherAnalytics />
                  </DashboardWrapper>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-course" 
              element={
                <ProtectedRoute>
                  <CreateCourse />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-manager" 
              element={
                <ProtectedRoute>
                  <UserManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course-manager" 
              element={
                <ProtectedRoute>
                  <CourseManager />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
