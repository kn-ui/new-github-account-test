import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  BarChart3,
  ClipboardCheck,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPreview = () => {
  const { currentUser } = useAuth();
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gradient-primary">
            Tailored Experiences for Every Role
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're a student, teacher, or administrator, our platform provides 
            the tools you need to succeed in your educational journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Dashboard */}
          <Card className="card-academic p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-primary rounded-full">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Student Portal</h3>
                <p className="text-sm text-muted-foreground">Your learning hub</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Mathematics 101</span>
                </div>
                <Badge variant="secondary">85% Complete</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Science Assignment</span>
                </div>
                <Badge variant="destructive">Due Tomorrow</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">History Quiz</span>
                </div>
                <Badge className="bg-success text-success-foreground">Completed</Badge>
              </div>
            </div>

            {currentUser ? (
              <Link to="/dashboard">
                <Button variant="academic" className="w-full">
                  Access Student Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button variant="academic" className="w-full">
                  Sign Up as Student
                </Button>
              </Link>
            )}
          </Card>

          {/* Teacher Dashboard */}
          <Card className="card-academic p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-success rounded-full">
                <Users className="h-6 w-6 text-success-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Teacher Portal</h3>
                <p className="text-sm text-muted-foreground">Manage your classes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Grade 10 - Mathematics</span>
                  <Badge variant="outline">32 Students</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <ClipboardCheck className="h-3 w-3" />
                  <span>15 assignments to review</span>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Grade 9 - Science</span>
                  <Badge variant="outline">28 Students</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  <span>Progress reports due</span>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Q&A Forum</span>
                  <Badge className="bg-warning text-warning-foreground">3 New</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>Student questions pending</span>
                </div>
              </div>
            </div>

            {currentUser ? (
              <Link to="/dashboard">
                <Button variant="success" className="w-full">
                  Access Teacher Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button variant="success" className="w-full">
                  Sign Up as Teacher
                </Button>
              </Link>
            )}
          </Card>

          {/* Admin Dashboard */}
          <Card className="card-academic p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-accent rounded-full">
                <BarChart3 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Admin Portal</h3>
                <p className="text-sm text-muted-foreground">System oversight</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold text-primary">1,247</div>
                  <div className="text-xs text-muted-foreground">Total Students</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold text-success">89</div>
                  <div className="text-xs text-muted-foreground">Active Teachers</div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Course Approvals</span>
                  <Badge className="bg-warning text-warning-foreground">5 Pending</Badge>
                </div>
                <div className="text-xs text-muted-foreground">New courses awaiting review</div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">System Health</span>
                  <Badge className="bg-success text-success-foreground">Excellent</Badge>
                </div>
                <div className="text-xs text-muted-foreground">All systems operational</div>
              </div>
            </div>

            {currentUser ? (
              <Link to="/dashboard">
                <Button variant="accent" className="w-full">
                  Access Admin Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button variant="accent" className="w-full">
                  Sign Up as Admin
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;