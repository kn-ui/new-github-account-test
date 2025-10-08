import { useLocation } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import LoginHeroAside from '@/components/LoginHeroAside';
import { ClerkSignIn } from '@/components/auth/ClerkSignIn';

import logo from '@/assets/logo.jpg';

const Login = () => {
  const location = useLocation();
  const { t } = useI18n();
  
  const from = location.state?.from?.pathname || '/dashboard';

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

            {/* Clerk Sign In Component */}
            <ClerkSignIn redirectUrl={from} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;