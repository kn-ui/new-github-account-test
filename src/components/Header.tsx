import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="glass-effect sticky top-0 z-50 w-full border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & School Name */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-primary">
              St. Raguel Church School
            </h1>
            <p className="text-xs text-muted-foreground">Educational Excellence</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-all duration-300 ease-out font-medium">
            Home
          </Link>
          <a href="#courses" className="text-foreground hover:text-primary transition-all duration-300 ease-out font-medium flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </a>
          <a href="#about" className="text-foreground hover:text-primary transition-all duration-300 ease-out font-medium flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>About</span>
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-all duration-300 ease-out font-medium">
            Contact
          </a>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            // Authenticated user menu
            <div className="flex items-center space-x-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {userProfile?.displayName || currentUser.displayName || 'Dashboard'}
                  </span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            // Guest user buttons
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;