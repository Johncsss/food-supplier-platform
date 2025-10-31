'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';
import { useAuth } from '@/components/providers/AuthProvider';
import { auth } from '@/lib/firebase';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, firebaseUser, isAdmin, isSalesTeam, isSupplier, userRole } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Redirect if already logged in
  useEffect(() => {
    if (firebaseUser && !isLoading) {
      const checkAndRedirect = async () => {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const role = tokenResult?.claims?.role;
          const isAdmin = tokenResult?.claims?.admin;
          
          // Only redirect if we're on the login page
          if (window.location.pathname === '/login') {
            console.log('Already logged in - redirecting based on role:', role);
            
                  // Use userRole from AuthProvider which checks both custom claims and Firestore
      const effectiveRole = userRole || role;
      
      // Check if supplier first - suppliers should always go to /supplier
      if (effectiveRole === 'supplier' || isSupplier) {
        window.location.href = '/supplier';
        return;
      }
      
      if (effectiveRole === 'salesMember') {
        const salesName = (tokenResult?.claims?.name as string) || (firebaseUser.displayName as string) || 'unknown';
        window.location.href = `/sales/${encodeURIComponent(salesName)}`;
      } else if (effectiveRole === 'salesTeam') {
        window.location.href = '/sales-team';
      } else if (firebaseUser.email === 'admin@test.com' || isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      };
      
      checkAndRedirect();
    }
  }, [firebaseUser, isLoading]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      await signIn(data.email, data.password);
      
      toast.success('登入成功！');
      
      // Check if user has specific redirect
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      
      // Small delay to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No current user found after login');
        router.push('/dashboard');
        return;
      }
      
      // Get token with latest claims (no need to force refresh immediately after login)
      const tokenResult = await currentUser.getIdTokenResult();
      const role = tokenResult?.claims?.role;
      const isAdmin = tokenResult?.claims?.admin;
      
      console.log('Login redirect - Role:', role, 'IsAdmin:', isAdmin);
      
      // Use userRole from AuthProvider which checks both custom claims and Firestore
      const effectiveRole = userRole || role;
      
      // Check if supplier first - suppliers should always go to /supplier
      if (effectiveRole === 'supplier' || isSupplier) {
        window.location.href = '/supplier';
        return;
      }
      
      if (effectiveRole === 'salesMember') {
        const salesName = (tokenResult?.claims?.name as string) || (currentUser.displayName as string) || 'unknown';
        window.location.href = `/sales/${encodeURIComponent(salesName)}`;
      } else if (effectiveRole === 'salesTeam') {
        window.location.href = '/sales-team';
      } else if (data.email === 'admin@test.com' || isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = '登入時發生錯誤';
      
      // Handle specific Firebase auth errors
      if (error.message.includes('user-not-found')) {
        errorMessage = '找不到此電子郵件地址的帳戶';
      } else if (error.message.includes('wrong-password')) {
        errorMessage = '密碼錯誤';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = '無效的電子郵件地址';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = '嘗試次數過多，請稍後再試';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('Welcome Back')}
            </h1>
            <p className="text-gray-600">
              {t('Sign in to your FoodSupplier Pro account')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {t('Email Address')}
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: t('Email is required'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('Invalid email address')
                  }
                })}
                className="input-field"
                placeholder="john@restaurant.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                {t('Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: t('Password is required') })}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                {t('Forgot your password?')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('Signing In...') : t('Sign In')}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('Don\'t have an account?')}{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('Sign up here')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
} 