'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import { validatePhoneNumber } from '@/lib/utils';

interface PhoneAuthForm {
  phoneNumber: string;
}

interface OTPForm {
  otp: string;
}

const AuthPage: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [verificationId, setVerificationId] = useState<string>('');
  const { signIn, verifyOTP, isLoading } = useAuth();
  const router = useRouter();

  const phoneForm = useForm<PhoneAuthForm>();
  const otpForm = useForm<OTPForm>();

  const handlePhoneSubmit = async (data: PhoneAuthForm) => {
    if (!validatePhoneNumber(data.phoneNumber)) {
      phoneForm.setError('phoneNumber', {
        type: 'manual',
        message: 'Please enter a valid phone number'
      });
      return;
    }

    try {
      const result = await signIn(data.phoneNumber);
      setVerificationId(result.verificationId);
      setStep('otp');
    } catch (error) {
      phoneForm.setError('phoneNumber', {
        type: 'manual',
        message: 'Failed to send OTP. Please try again.'
      });
    }
  };

  const handleOTPSubmit = async (data: OTPForm) => {
    if (data.otp.length !== 6) {
      otpForm.setError('otp', {
        type: 'manual',
        message: 'OTP must be 6 digits'
      });
      return;
    }

    try {
      await verifyOTP(verificationId, data.otp);
      router.push('/dashboard');
    } catch (error) {
      otpForm.setError('otp', {
        type: 'manual',
        message: 'Invalid OTP. Please try again.'
      });
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationId('');
    otpForm.reset();
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
              {step === 'phone' ? 'Sign in with Phone' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'Enter your phone number to receive a verification code'
                : 'Enter the 6-digit code sent to your phone'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  {...phoneForm.register('phoneNumber', { required: 'Phone number is required' })}
                  error={phoneForm.formState.errors.phoneNumber?.message}
                  disabled={isLoading}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  loading={isLoading}
                  disabled={isLoading}
                >
                  <Icons.Phone size={16} className="mr-2" />
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-4">
                <Input
                  type="text"
                  label="Verification Code"
                  placeholder="123456"
                  maxLength={6}
                  {...otpForm.register('otp', { required: 'OTP is required' })}
                  error={otpForm.formState.errors.otp?.message}
                  disabled={isLoading}
                />
                
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    <Icons.Shield size={16} className="mr-2" />
                    Verify OTP
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleBackToPhone}
                    disabled={isLoading}
                  >
                    Back to Phone Number
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Secure authentication with phone verification</p>
          <p>📱 Connect LinkedIn & Google accounts</p>
          <p>🚀 Start with 1 free post, upgrade for unlimited</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
