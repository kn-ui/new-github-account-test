import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import LoginHeroAside from '@/components/LoginHeroAside';
import logo from '@/assets/logo.jpg';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { signIn, isLoaded, setActive } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Sign in with Clerk
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        // Navigate to dashboard or intended page
        navigate(from, { replace: true });
      } else {
        // Handle other statuses if needed
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error messages
      if (err.errors && err.errors[0]) {
        const errorMessage = err.errors[0].message;
        
        if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('not found')) {
          setError('No account found with this email. Please contact your administrator.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('An error occurred during sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-[#13A0E2] flex">
      <LoginHeroAside />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-xl shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="St. Raguel Church Logo" className="h-20 w-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('auth.welcomeBack') || 'Welcome Back'}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('auth.signInSubtitle') || 'Sign in to your St. Raguel Church account'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <span className="text-blue-600 font-medium">
                  Contact your administrator
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Only administrators can create new accounts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
