'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';

interface PhoneVerificationForm {
  phoneNumber: string;
  verificationCode: string;
}

const VerificationSteps: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'email' | 'phone' | 'google' | 'complete'>('email');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  
  const { 
    user, 
    sendEmailVerificationLink, 
    checkEmailVerificationStatus,
    sendPhoneVerificationCode, 
    verifyPhoneCode,
    linkGoogleAccount,
    getAuthSteps,
    isLoading 
  } = useAuth();
  
  const phoneForm = useForm<PhoneVerificationForm>();
  
  const authSteps = getAuthSteps();

  // Determine current step based on completion status
  React.useEffect(() => {
    const emailCompleted = authSteps.find(s => s.step === 'email-verification')?.completed;
    const phoneCompleted = authSteps.find(s => s.step === 'phone-verification')?.completed;
    const googleCompleted = authSteps.find(s => s.step === 'google-connection')?.completed;
    
    if (!emailCompleted) {
      setCurrentStep('email');
    } else if (!phoneCompleted) {
      setCurrentStep('phone');
    } else if (!googleCompleted) {
      setCurrentStep('google');
    } else {
      setCurrentStep('complete');
    }
  }, [authSteps]);
  
  if (!user) return null;

  const handleSendEmailVerification = async () => {
    try {
      await sendEmailVerificationLink();
    } catch {
      // Error handled by auth context
    }
  };

  const handleCheckEmailStatus = async () => {
    try {
      await checkEmailVerificationStatus();
    } catch {
      // Error handled by auth context
    }
  };

  const handleSendPhoneCode = async (data: PhoneVerificationForm) => {
    try {
      await sendPhoneVerificationCode(data.phoneNumber);
      setPhoneStep('verify');
    } catch {
      // Error handled by auth context
    }
  };

  const handleVerifyPhoneCode = async (data: PhoneVerificationForm) => {
    try {
      await verifyPhoneCode(data.verificationCode);
      setPhoneStep('input');
    } catch {
      // Error handled by auth context
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount();
    } catch {
      // Error handled by auth context
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'email', label: 'Email', completed: authSteps.find(s => s.step === 'email-verification')?.completed },
      { key: 'phone', label: 'Phone', completed: authSteps.find(s => s.step === 'phone-verification')?.completed },
      { key: 'google', label: 'Google', completed: authSteps.find(s => s.step === 'google-connection')?.completed },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : currentStep === step.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {step.completed ? (
                <Icons.Check size={16} />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-px ${
                steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (currentStep === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Icons.Check size={32} color="white" />
          </div>
          <CardTitle className="text-green-600">All Set!</CardTitle>
          <CardDescription>
            Your account is fully verified and ready to use.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {renderStepIndicator()}
      
      {/* Email Verification Step */}
      {currentStep === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Mail className="mr-2" size={20} />
              Verify Your Email
            </CardTitle>
            <CardDescription>
              We need to verify your email address: {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the button below to send a verification email to your inbox.
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSendEmailVerification}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icons.Mail size={16} className="mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCheckEmailStatus}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Icons.Check size={16} className="mr-2" />
                      Check Status
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                After clicking the link in your email, click &quot;Check Status&quot; to verify.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Verification Step */}
      {currentStep === 'phone' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Phone className="mr-2" size={20} />
              Verify Your Phone
            </CardTitle>
            <CardDescription>
              {phoneStep === 'input' 
                ? 'Enter your phone number to receive a verification code'
                : 'Enter the verification code sent to your phone'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phoneStep === 'input' ? (
              <form onSubmit={phoneForm.handleSubmit(handleSendPhoneCode)} className="space-y-4">
                <div>
                  <Input
                    {...phoneForm.register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+\d{10,15}$/,
                        message: 'Phone number must be in format +1234567890'
                      }
                    })}
                    placeholder="Phone Number (+1234567890)"
                    defaultValue={user.phoneNumber}
                    disabled={isLoading}
                  />
                  {phoneForm.formState.errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {phoneForm.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Icons.Phone size={16} className="mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={phoneForm.handleSubmit(handleVerifyPhoneCode)} className="space-y-4">
                <div>
                  <Input
                    {...phoneForm.register('verificationCode', { 
                      required: 'Verification code is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Verification code must be 6 digits'
                      }
                    })}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  {phoneForm.formState.errors.verificationCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {phoneForm.formState.errors.verificationCode.message}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setPhoneStep('input')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Icons.Spinner size={16} className="mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Google Connection Step */}
      {currentStep === 'google' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Google className="mr-2" size={20} />
              Connect Google Account
            </CardTitle>
            <CardDescription>
              Connect your Google account to enable additional features and data sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Enhanced security with Google SSO
                </li>
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Easier account management
                </li>
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Future integration capabilities
                </li>
              </ul>
              <Button 
                onClick={handleLinkGoogle}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Icons.Spinner size={16} className="mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Icons.Google size={16} className="mr-2" />
                    Connect Google Account
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('complete')}
                disabled={isLoading}
                className="w-full"
              >
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerificationSteps;
