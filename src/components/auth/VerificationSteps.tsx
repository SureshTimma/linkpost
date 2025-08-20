"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/contexts/auth-context";

interface PhoneVerificationForm {
  phoneNumber: string;
  otpCode: string;
}

const VerificationSteps: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    "email" | "phone" | "google" | "linkedin" | "complete"
  >("email");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailSentTime, setEmailSentTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const {
    user,
    sendEmailVerificationLink,
    checkEmailVerificationStatus,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    linkGoogleAccount,
    linkLinkedin,
    getAuthSteps,
    refreshUserData,
    isLoading,
  } = useAuth();

  const phoneForm = useForm<PhoneVerificationForm>();

  const authSteps = getAuthSteps();

  // Cooldown timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (emailSentTime && cooldownRemaining > 0) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - emailSentTime) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setCooldownRemaining(remaining);

        if (remaining === 0) {
          setEmailSentTime(null);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailSentTime, cooldownRemaining]);

  // Smart refresh only when component mounts and verification is needed
  React.useEffect(() => {
    const smartRefreshData = async () => {
      if (!user) return;

      // Check if user needs verification
      const needsEmailVerification = !user.verification?.emailVerified;
      const needsPhoneVerification = !user.verification?.phoneVerified;
      
      // Only refresh if verification is actually needed
      if (needsEmailVerification || needsPhoneVerification) {
        try {
          console.log('VerificationSteps: Refreshing user data for verification status');
          await refreshUserData();
        } catch (error) {
          console.error('Failed to refresh user data in verification steps:', error);
        }
      } else {
        console.log('VerificationSteps: User already verified, skipping refresh');
      }
    };

    smartRefreshData();
  }, [user, refreshUserData]); // Keep original dependencies to satisfy linter

  // Determine current step based on completion status
  React.useEffect(() => {
    const emailCompleted = authSteps.find(
      (s) => s.step === "email-verification"
    )?.completed;
    const phoneCompleted = authSteps.find(
      (s) => s.step === "phone-verification"
    )?.completed;
    const googleCompleted = authSteps.find(
      (s) => s.step === "google-connection"
    )?.completed;
    const linkedinCompleted = authSteps.find(
      (s) => s.step === "linkedin-connection"
    )?.completed;

    if (!emailCompleted) {
      setCurrentStep("email");
    } else if (!phoneCompleted) {
      setCurrentStep("phone");
    } else if (!googleCompleted) {
      setCurrentStep("google");
    } else if (!linkedinCompleted) {
      setCurrentStep("linkedin");
    } else {
      setCurrentStep("complete");
    }
  }, [authSteps]);

  // Initialize email sent time if user already has verification email sent
  React.useEffect(() => {
    if (user?.verification?.emailVerificationSentAt && !emailSentTime) {
      const sentTime = new Date(
        user.verification.emailVerificationSentAt
      ).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - sentTime) / 1000);

      if (elapsed < 60) {
        setEmailSentTime(sentTime);
        setCooldownRemaining(60 - elapsed);
      }
    }
  }, [user?.verification?.emailVerificationSentAt, emailSentTime]);

  if (!user) return null;

  const handleSendEmailVerification = async () => {
    try {
      await sendEmailVerificationLink();
      const now = Date.now();
      setEmailSentTime(now);
      setCooldownRemaining(60);
    } catch {
      // Error handled by auth context
    }
  };

  // Rate limited refresh to prevent excessive calls
  let lastRefreshTime = 0;
  const refreshWithRateLimit = async () => {
    const now = Date.now();
    if (now - lastRefreshTime > 2000) { // Only refresh every 2 seconds
      lastRefreshTime = now;
      try {
        console.log('VerificationSteps: Rate-limited refresh user data');
        await refreshUserData();
      } catch (error) {
        console.error('Rate-limited refresh failed:', error);
      }
    } else {
      console.log('VerificationSteps: Skipping refresh due to rate limit');
    }
  };

  const handleCheckEmailStatus = async () => {
    try {
      await checkEmailVerificationStatus();
      // Use rate-limited refresh to prevent excessive calls
      await refreshWithRateLimit();
    } catch {
      // Error handled by auth context
    }
  };

  const handleSendPhoneCode = async (data: PhoneVerificationForm) => {
    try {
      await sendPhoneVerificationCode(data.phoneNumber);
      setOtpSent(true);
      setIsEditingPhone(false); // Close edit mode on success
    } catch {
      // Error handled by auth context
    }
  };

  const handleVerifyOtpCode = async (data: PhoneVerificationForm) => {
    try {
      await verifyPhoneCode(data.otpCode);
      setOtpSent(false);
      // Use rate-limited refresh to prevent excessive calls
      await refreshWithRateLimit();
    } catch {
      // Error handled by auth context
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount();
      // Use rate-limited refresh to prevent excessive calls
      await refreshWithRateLimit();
    } catch {
      // Error handled by auth context
    }
  };

  const handleLinkLinkedin = async () => {
    try {
      await linkLinkedin();
      // Use rate-limited refresh to prevent excessive calls
      await refreshWithRateLimit();
    } catch {
      // Error handled by auth context
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      {
        key: "email",
        label: "Email",
        completed: authSteps.find((s) => s.step === "email-verification")
          ?.completed,
      },
      {
        key: "phone",
        label: "Phone",
        completed: authSteps.find((s) => s.step === "phone-verification")
          ?.completed,
      },
      {
        key: "google",
        label: "Google",
        completed: authSteps.find((s) => s.step === "google-connection")
          ?.completed,
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        completed: authSteps.find((s) => s.step === "linkedin-connection")
          ?.completed,
      },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.completed
                  ? "bg-green-500 text-white"
                  : currentStep === step.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {step.completed ? <Icons.Check size={16} /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  steps[index + 1].completed ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (currentStep === "complete") {
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
      {currentStep === "email" && (
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
                {emailSentTime
                  ? "Verification email sent! Check your inbox and spam folder."
                  : "Click the button below to send a verification email to your inbox."}
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSendEmailVerification}
                  disabled={isLoading || cooldownRemaining > 0}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Sending...
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <Icons.Clock size={16} className="mr-2" />
                      Resend in {cooldownRemaining}s
                    </>
                  ) : emailSentTime ? (
                    <>
                      <Icons.Refresh size={16} className="mr-2" />
                      Resend Email
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
                After clicking the link in your email, click &quot;Check
                Status&quot; to verify.
                {emailSentTime && (
                  <span className="block mt-1 text-green-600">
                    ✓ Verification email sent to {user.email}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Verification Step */}
      {currentStep === "phone" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Phone className="mr-2" size={20} />
              Verify Your Phone
            </CardTitle>
            <CardDescription>
              {user.verification.phoneVerified
                ? "Your phone number is verified"
                : otpSent
                ? "Enter the 6-digit OTP sent to your phone"
                : isEditingPhone
                ? "Update your phone number below"
                : "Add and verify your phone number for enhanced security"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.verification.phoneVerified ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <Icons.Check size={20} className="mr-3 text-green-600" />
                    <span className="font-medium">{user.phoneNumber}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingPhone(true);
                      setOtpSent(false);
                    }}
                    className="ml-2"
                  >
                    <Icons.Edit size={16} className="mr-1" />
                    Change
                  </Button>
                </div>
                <p className="text-sm text-green-600">
                  ✓ Your phone number has been verified and saved to your
                  account.
                </p>
              </div>
            ) : otpSent ? (
              <form
                onSubmit={phoneForm.handleSubmit(handleVerifyOtpCode)}
                className="space-y-4"
              >
                <div>
                  <Input
                    {...phoneForm.register("otpCode", {
                      required: "OTP code is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "OTP must be 6 digits",
                      },
                    })}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    disabled={isLoading}
                    className="text-center text-lg tracking-widest"
                  />
                  {phoneForm.formState.errors.otpCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {phoneForm.formState.errors.otpCode.message}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Icons.Spinner size={16} className="mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Icons.Check size={16} className="mr-2" />
                        Verify OTP
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpSent(false)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Didn&apos;t receive the code? Check your messages or try
                  again.
                </p>
              </form>
            ) : !isEditingPhone && !user.phoneNumber ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add your phone number to receive important notifications and
                  enhance account security.
                </p>
                <Button
                  onClick={() => setIsEditingPhone(true)}
                  className="w-full"
                >
                  <Icons.Phone size={16} className="mr-2" />
                  Add Phone Number
                </Button>
              </div>
            ) : !isEditingPhone ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Icons.Phone size={20} className="mr-3 text-gray-600" />
                    <span className="font-medium">{user.phoneNumber}</span>
                    <span className="ml-2 text-sm text-orange-600">
                      (Not verified)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPhone(true)}
                    className="ml-2"
                  >
                    <Icons.Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    phoneForm.setValue("phoneNumber", user.phoneNumber);
                    handleSendPhoneCode({
                      phoneNumber: user.phoneNumber,
                      otpCode: "",
                    });
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Icons.Spinner size={16} className="mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Icons.Phone size={16} className="mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={phoneForm.handleSubmit(handleSendPhoneCode)}
                className="space-y-4"
              >
                <div>
                  <Input
                    {...phoneForm.register("phoneNumber", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^\+\d{10,15}$/,
                        message: "Phone number must be in format +1234567890",
                      },
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
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Icons.Spinner size={16} className="mr-2" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Icons.Phone size={16} className="mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingPhone(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  We&apos;ll send a 6-digit verification code to this number.
                </p>
              </form>
            )}
            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>
      )}

      {/* Google Connection Step */}
      {currentStep === "google" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Google className="mr-2" size={20} />
              Connect Google Account
            </CardTitle>
            <CardDescription>
              Connect your Google account to complete the verification process. This step is required to access the dashboard.
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* LinkedIn Connection Step */}
      {currentStep === "linkedin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.LinkedIn className="mr-2" size={20} />
              Connect LinkedIn Account
            </CardTitle>
            <CardDescription>
              Connect your LinkedIn account to complete the verification process. This step is required to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Professional networking features
                </li>
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Enhanced profile information
                </li>
                <li className="flex items-center">
                  <Icons.Check size={16} className="mr-2 text-green-500" />
                  Business networking tools
                </li>
              </ul>
              <Button
                onClick={handleLinkLinkedin}
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
                    <Icons.LinkedIn size={16} className="mr-2" />
                    Connect LinkedIn Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recaptcha container for phone verification */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default VerificationSteps;
