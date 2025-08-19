'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import toast from 'react-hot-toast';

interface PhoneAuthProps {
  onSuccess?: () => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onSuccess }) => {
  const { sendOTP, verifyOTP, isLoading } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  console.log('🔄 PhoneAuth render - step:', step, 'phoneNumber:', phoneNumber, 'isLoading:', isLoading);

  // Debug: Check if recaptcha container is mounted
  useEffect(() => {
    console.log('🔍 PhoneAuth component mounted, checking for recaptcha container...');
    const checkContainer = () => {
      const container = document.getElementById('recaptcha-container');
      console.log('📦 Recaptcha container check:', container);
      if (container) {
        console.log('✅ Recaptcha container found in DOM');
        console.log('   Element:', container);
        console.log('   Class:', container.className);
        console.log('   Parent:', container.parentElement);
      } else {
        console.log('❌ Recaptcha container NOT found in DOM');
      }
    };
    
    // Check immediately and after a delay
    checkContainer();
    setTimeout(checkContainer, 1000);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    console.log('📞 handleSendOTP called');
    console.log('🚨 BUTTON ACTUALLY CLICKED - FORM HANDLER TRIGGERED!');
    e.preventDefault();
    
    console.log('📱 Raw phone number input:', phoneNumber);
    if (!phoneNumber) {
      console.log('❌ No phone number provided');
      alert('Please enter a phone number'); // Add visual feedback
      return;
    }

    try {
      console.log('🔢 Processing phone number...');
      const digits = phoneNumber.replace(/\D/g, '');
      console.log('🔢 Extracted digits:', digits);

      if (digits.length < 10) {
        console.error('❌ Phone number has too few digits.');
        toast.error('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      
      let e164: string;
      if (digits.length === 10) {
        e164 = `+1${digits}`;
        console.log('🇺🇸 Assuming US number, adding +1');
      } else {
        e164 = `+${digits}`;
        console.log('🌍 Assuming country code included');
      }
      
      console.log('📞 Final E.164 phone number:', e164);
      console.log('🚀 Calling sendOTP...');
      
      await sendOTP(e164);
      console.log('✅ sendOTP successful, switching to OTP step');
      setStep('otp');
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    console.log('🔐 handleVerifyOTP called');
    e.preventDefault();
    
    console.log('🔢 OTP input:', otp);
    if (!otp) {
      console.log('❌ No OTP provided');
      return;
    }

    try {
      console.log('🚀 Calling verifyOTP...');
      await verifyOTP(otp);
      console.log('✅ OTP verification successful');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
    }
  };  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📱 Phone input changed:', e.target.value);
    const formatted = formatPhoneNumber(e.target.value);
    console.log('📱 Formatted phone number:', formatted);
    setPhoneNumber(formatted);
    
    // Log validation state
    const digits = formatted.replace(/\D/g, '');
    console.log('🔢 Digits only:', digits);
    console.log('📏 Digits length:', digits.length);
    console.log('✅ Button enabled:', digits.length >= 10);
  };

  if (step === 'otp') {
    console.log('📱 Rendering OTP step');
    return (
      <div className="w-full max-w-sm mx-auto">
        <div id="recaptcha-container" className="hidden" />
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Phone
            </h2>
            <p className="text-gray-600 text-sm">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-mono tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </Button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to phone number
            </button>
          </form>
        </div>
      </div>
    );
  }

  console.log('📱 Rendering phone input step');
  return (
    <div className="w-full max-w-sm mx-auto">
      <div id="recaptcha-container" className="hidden" />
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In
          </h2>
          <p className="text-gray-600 text-sm">
            Enter your phone number to get started
          </p>
        </div>

        <form onSubmit={(e) => {
          console.log('📝 Form submitted!');
          console.log('📱 Phone number at submit:', phoneNumber);
          handleSendOTP(e);
        }} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+15551234567 or (555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || phoneNumber.replace(/\D/g, '').length < 10}
            className="w-full"
            onClick={() => {
              console.log('🔴 Button clicked!');
              console.log('📱 Current phone number:', phoneNumber);
              console.log('🔢 Digits:', phoneNumber.replace(/\D/g, ''));
              console.log('📏 Digits length:', phoneNumber.replace(/\D/g, '').length);
              console.log('⏳ Is loading:', isLoading);
              console.log('🚫 Is disabled:', isLoading || phoneNumber.replace(/\D/g, '').length < 10);
            }}
          >
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
