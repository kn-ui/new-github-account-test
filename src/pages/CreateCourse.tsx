import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import CourseCreateForm from '@/components/CourseCreateForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const CreateCourse = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !currentUser) {
      navigate('/login');
      return;
    }

    // Redirect if not admin (teachers no longer allowed)
    if (!loading && userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, userProfile, loading, navigate]);

 const handleSuccess = () => {
    navigate('/dashboard/courses'); // Changed from /dashboard to /dashboard/courses
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px] max-h-[600px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have permission
  if (!loading && (!userProfile || userProfile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to create courses. Only administrators can create courses.
              </AlertDescription>
            </Alert>
            

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
              <p className="text-muted-foreground">
                Design and publish a new course for students to discover and enroll in.
              </p>
            </div>
          </div>

          {/* Course Creation Form */}
          <CourseCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultIsActive={userProfile?.role === 'admin'} // admin can publish active; teacher is pending
          />
        </div>
      </main>
    </div>
  );
};

export default CreateCourse;