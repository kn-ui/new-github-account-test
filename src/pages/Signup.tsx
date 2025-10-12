import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { CustomSignUp } from '@/components/auth/CustomSignUp';
import { useLocation } from 'react-router-dom';

const Signup = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  
  // For now, we'll show the custom signup form
  // You can uncomment the restricted section below if you want to keep signup restricted
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-[#13A0E2] flex">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-xl shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src="/raguel logo.jpg" alt="St. Raguel Church Logo" className="h-20 w-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Account
              </h2>
              <p className="text-gray-600 mt-2">
                Sign up for your St. Raguel Church account
              </p>
            </div>

            {/* Custom Sign Up Component */}
            <CustomSignUp redirectUrl={from} />
          </div>
        </div>
      </div>
    </div>
  );

  // Uncomment this section if you want to keep signup restricted
  /*
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <img src="/raguel logo.jpg" alt="St. Raguel Church Logo" className="h-20 w-auto" />
          </div>
        </div>

        <Card className="glass-effect border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Account Creation Restricted</CardTitle>
            <CardDescription>
              Only administrators can create new accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                New user accounts can only be created by administrators through the User Management system.
                If you need an account, please contact your administrator.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">
                  Sign In to Existing Account
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  */
};

export default Signup;