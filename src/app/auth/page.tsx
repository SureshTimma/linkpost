'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface LoginForm {
  email: string;
  password: string;
}

const NewAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const { registerWithEmail, signInWithEmail, signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();

  const registerForm = useForm<RegisterForm>();
  const loginForm = useForm<LoginForm>();

  const handleRegisterSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      });
      return;
    }

    if (data.password.length < 6) {
      registerForm.setError('password', {
        type: 'manual',
        message: 'Password must be at least 6 characters'
      });
      return;
    }

    try {
      await registerWithEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password
      });
      router.push('/dashboard');
    } catch {
      // Error is already handled by the auth context
    }
  };

  const handleLoginSubmit = async (data: LoginForm) => {
    try {
      await signInWithEmail(data.email, data.password);
      router.push('/dashboard');
    } catch {
      // Error is already handled by the auth context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      // Error is already handled by the auth context
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-700 rounded-lg flex items-center justify-center">
            <Icons.LinkedIn size={24} color="white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to LinkPost
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your friendly LinkedIn auto-posting companion
          </p>
        </div>

        {/* Authentication Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to your account to continue'
                : 'Create a new account to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign In Button - Only show for login */}
            {isLogin && (
              <>
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? (
                    <Icons.Spinner size={16} className="mr-2" />
                  ) : (
                    <Icons.Google size={16} className="mr-2" />
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Registration Form */}
            {!isLogin && (
              <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      {...registerForm.register('firstName', { required: 'First name is required' })}
                      placeholder="First Name"
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      {...registerForm.register('lastName', { required: 'Last name is required' })}
                      placeholder="Last Name"
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Input
                    {...registerForm.register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    placeholder="Email Address"
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    {...registerForm.register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+\d{10,15}$/,
                        message: 'Phone number must be in format +1234567890'
                      }
                    })}
                    placeholder="Phone Number (+1234567890)"
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    {...registerForm.register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                    type="password"
                    placeholder="Confirm Password"
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}

            {/* Login Form */}
            {isLogin && (
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <div>
                  <Input
                    {...loginForm.register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    placeholder="Email Address"
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    {...loginForm.register('password', { required: 'Password is required' })}
                    type="password"
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}

            {/* Toggle between login and register */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 hover:text-blue-500"
                disabled={isLoading}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAuthPage;
