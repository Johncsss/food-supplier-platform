'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Eye, EyeOff, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';
import { useAuth } from '@/components/providers/AuthProvider';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  restaurantName: string;
  phone: string;
  street: string;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error(t('Passwords do not match'));
      return;
    }

    setIsLoading(true);

    try {
      await signUp(data.email, data.password, {
        name: data.name,
        restaurantName: data.restaurantName,
        phone: data.phone,
        address: {
          street: data.street,
          city: '',
          state: '',
          zipCode: '',
        },
      });
      toast.success('帳戶創建成功！');
      router.push('/pricing');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = '創建帳戶時發生錯誤';
      
      // Handle specific Firebase auth errors
      if (error.message.includes('email-already-in-use')) {
        errorMessage = '此電子郵件地址已被使用';
      } else if (error.message.includes('weak-password')) {
        errorMessage = '密碼強度不足，請使用至少6個字符';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = '無效的電子郵件地址';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('Create Your Restaurant Account')}
            </h1>
            <p className="text-gray-600">
              {t('Join FoodSupplier Pro and get access to premium food supply services.')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('Full Name')}
                </label>
                <input
                  type="text"
                  {...register('name', { required: t('Name is required') })}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

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
            </div>

            {/* Restaurant Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  {t('Restaurant Name')}
                </label>
                <input
                  type="text"
                  {...register('restaurantName', { required: t('Restaurant name is required') })}
                  className="input-field"
                  placeholder="The Garden Bistro"
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-sm mt-1">{errors.restaurantName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t('Phone Number')}
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: t('Phone number is required') })}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                {t('Street Address')}
              </label>
              <input
                type="text"
                {...register('street', { required: t('Street address is required') })}
                className="input-field"
                placeholder="123 Restaurant Ave"
              />
              {errors.street && (
                <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: t('Password is required'),
                      minLength: {
                        value: 6,
                        message: t('Password must be at least 6 characters')
                      }
                    })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Confirm Password')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: t('Please confirm your password'),
                      validate: value => value === password || t('Passwords do not match')
                    })}
                    className="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-gray-600">
                {t('Already have an account?')}{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('Sign in here')}
                </Link>
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('Creating Account...') : t('Create Account')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
} 