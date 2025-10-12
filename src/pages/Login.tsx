import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { useI18n } from '@/contexts/I18nContext';
import LoginHeroAside from '@/components/LoginHeroAside';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import logo from '@/assets/logo.jpg';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Attempt to sign in with email and password
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        // Handle other statuses (e.g., needs verification)
        console.error('Sign in incomplete:', result.status);
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Handle Clerk errors
      const errorMessage = err.errors?.[0]?.message || err.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
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
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email') || 'Email Address'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password') || 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signingIn') || 'Signing in...'}
                  </>
                ) : (
                  t('auth.signIn') || 'Sign In'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.needAccount') || "Don't have an account?"}{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  {t('auth.contactAdmin') || 'Contact Administrator'}
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t('auth.accountCreationRestricted') || 'New accounts can only be created by administrators'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;