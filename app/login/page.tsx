'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';
import { useAuth } from '@/components/providers/AuthProvider';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
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
          const hasAdminClaim = tokenResult?.claims?.admin;
          
          // Only redirect if we're on the login page
          if (window.location.pathname === '/login') {
            console.log('Already logged in - redirecting based on role:', role, 'isAdmin from hook:', isAdmin, 'hasAdminClaim:', hasAdminClaim);
            
            // Use userRole from AuthProvider which checks both custom claims and Firestore
            const effectiveRole = userRole || role;
            
            // Priority order: Admin → Supplier → Sales roles → Member (default)
            
            // 1. Admin should go to /admin/welcome (Welcome back page)
            if (isAdmin || hasAdminClaim || role === 'admin') {
              window.location.href = '/admin/welcome';
              return;
            }
            
            // 2. Supplier should go to /supplier (供應商系統 Supplier Panel)
            if (effectiveRole === 'supplier' || isSupplier) {
              window.location.href = '/supplier';
              return;
            }
            
            // 3. Restaurant member
            if (effectiveRole === 'member' || effectiveRole === 'restaurant' || effectiveRole === 'memberRestaurant') {
              window.location.href = '/dashboard';
              return;
            }
            
            // 4. Sales roles
            if (effectiveRole === 'salesMember') {
              const salesName = (tokenResult?.claims?.name as string) || (firebaseUser.displayName as string) || 'unknown';
              window.location.href = `/sales/${encodeURIComponent(salesName)}`;
              return;
            } else if (effectiveRole === 'salesTeam' || isSalesTeam) {
              window.location.href = '/sales-team';
              return;
            }
            
            // 5. Default: Member goes to /dashboard (餐廳)
            window.location.href = '/dashboard';
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
      const redirectTo = searchParams?.get('redirect');
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
      const hasAdminClaim = tokenResult?.claims?.admin;
      
      console.log('Login redirect - Role:', role, 'IsAdmin:', isAdmin, 'HasAdminClaim:', hasAdminClaim);
      
      // Use userRole from AuthProvider which checks both custom claims and Firestore
      const effectiveRole = userRole || role;
      
      // Priority order: Admin → Supplier → Sales roles → Member (default)
      
      // 1. Admin should go to /admin/welcome (Welcome back page)
      if (isAdmin || hasAdminClaim || role === 'admin') {
        window.location.href = '/admin/welcome';
        return;
      }
      
      // 2. Supplier should go to /supplier (供應商系統 Supplier Panel)
      if (effectiveRole === 'supplier' || isSupplier) {
        window.location.href = '/supplier';
        return;
      }
      
      // 3. Restaurant member
      if (effectiveRole === 'member' || effectiveRole === 'restaurant' || effectiveRole === 'memberRestaurant') {
        window.location.href = '/dashboard';
        return;
      }
      
      // 4. Sales roles
      if (effectiveRole === 'salesMember') {
        const salesName = (tokenResult?.claims?.name as string) || (currentUser.displayName as string) || 'unknown';
        window.location.href = `/sales/${encodeURIComponent(salesName)}`;
        return;
      } else if (effectiveRole === 'salesTeam' || isSalesTeam) {
        window.location.href = '/sales-team';
        return;
      }
      
      // 5. Default: Member goes to /dashboard (餐廳)
      window.location.href = '/dashboard';
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

  const ensureRecaptcha = async () => {
    if (typeof window === 'undefined') return null;
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;

    const container = document.getElementById('recaptcha-container');
    if (!container) return null;

    // Firebase requires reCAPTCHA verifier for Phone Auth on web
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const normalizePhone = (raw: string) => {
    const trimmed = raw.trim();
    // If it doesn't start with +, prepend +852
    if (trimmed && !trimmed.startsWith('+')) {
      return `+852${trimmed}`;
    }
    // If it already has +852, use as is; otherwise ensure it starts with +
    if (trimmed.startsWith('+852')) {
      return trimmed;
    }
    return trimmed.startsWith('+') ? trimmed : `+852${trimmed}`;
  };

  const handleSendSms = async () => {
    setIsPhoneLoading(true);
    try {
      if (!phoneNumber.trim()) {
        toast.error('請輸入手機號碼');
        return;
      }
      const phone = normalizePhone(phoneNumber);

      const verifier = await ensureRecaptcha();
      if (!verifier) {
        toast.error('reCAPTCHA 初始化失敗，請重新整理頁面再試一次');
        return;
      }

      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      toast.success('驗證碼已送出');
    } catch (error: any) {
      console.error('Phone SMS send error:', error);
      toast.error(error?.message || '發送驗證碼失敗');
      // If reCAPTCHA got into a bad state, reset it so user can retry
      try {
        recaptchaVerifierRef.current?.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const ensureUserDocForPhoneLogin = async (uid: string, phone: string) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return;

      await setDoc(
        ref,
        {
          id: uid,
          firebaseUid: uid,
          email: '',
          phone,
          role: 'member',
          name: '',
          restaurantName: '',
          membershipStatus: 'inactive',
          membershipExpiry: null,
          memberPoints: 0,
          pendingPoints: 0,
          address: { street: '' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (e) {
      // Soft-fail: user can still be signed in, app will use minimal profile
      console.warn('Failed to ensure user doc for phone login:', e);
    }
  };

  const handleVerifySms = async () => {
    setIsPhoneLoading(true);
    try {
      if (!confirmationResult) {
        toast.error('請先發送驗證碼');
        return;
      }
      if (!smsCode.trim()) {
        toast.error('請輸入驗證碼');
        return;
      }

      const result = await confirmationResult.confirm(smsCode.trim());
      await ensureUserDocForPhoneLogin(result.user.uid, normalizePhone(phoneNumber));

      toast.success('登入成功！');

      const redirectTo = searchParams?.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Phone verify error:', error);
      toast.error(error?.message || '驗證失敗，請確認驗證碼是否正確');
    } finally {
      setIsPhoneLoading(false);
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
              {t('Sign in to your iFoodPulse account')}
            </p>
          </div>

          {/* Phone verification option hidden */}
          <div className="mb-6 hidden">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setConfirmationResult(null);
                setSmsCode('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                loginMethod === 'email'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setConfirmationResult(null);
                setSmsCode('');
                setPhoneNumber('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                loginMethod === 'phone'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              手機驗證
            </button>
          </div>

          {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
          <div id="recaptcha-container" className="hidden" />

          {loginMethod === 'email' ? (
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
                <Link href="/partners/apply" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('Sign up here')}
                </Link>
              </p>
            </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  手機號碼
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-700 font-medium">
                    +852
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="input-field rounded-l-none flex-1"
                    placeholder="91234567"
                    disabled={isPhoneLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  請輸入您的手機號碼（不含國碼）
                </p>
              </div>

              {confirmationResult ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    驗證碼
                  </label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    className="input-field"
                    placeholder="123456"
                    disabled={isPhoneLoading}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3">
                {!confirmationResult ? (
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={isPhoneLoading}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPhoneLoading ? '發送中...' : '發送驗證碼'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifySms}
                    disabled={isPhoneLoading}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPhoneLoading ? '驗證中...' : '驗證並登入'}
                  </button>
                )}

                {confirmationResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setSmsCode('');
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isPhoneLoading}
                  >
                    重新發送
                  </button>
                ) : null}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t('Don\'t have an account?')}{' '}
                  <Link href="/partners/apply" className="text-primary-600 hover:text-primary-700 font-medium">
                    {t('Sign up here')}
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 