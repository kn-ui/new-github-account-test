import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardWrapper from "./components/DashboardWrapper";
import Courses from "./pages/Courses";
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
import AdminSettings from "./pages/AdminSettings";
import TeacherCourses from "./pages/TeacherCourses";
import StudentCourses from "./pages/StudentCourses";
import TeacherGrades from "./pages/TeacherGrades";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import StudentGrades from "./pages/StudentGrades";
import SearchResults from "./pages/SearchResults";

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
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:threadId" element={<ForumThread />} />
            {/* Development-only routes removed */}
            {/* <Route path="/catalog" element={<Catalog />} /> */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
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
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <DashboardWrapper>
                    <AdminSettings />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}


            <Route 
              path="/events" 
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } 
            />
            {/* create-event deprecated in favor of modal */}
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submissions" 
              element={
                <ProtectedRoute>
                  <Submissions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-reports" 
              element={
                <ProtectedRoute>
                  <TeacherReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/certificates" 
              element={
                <ProtectedRoute>
                  <Certificates />
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
