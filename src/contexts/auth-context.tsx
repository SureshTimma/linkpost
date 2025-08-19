'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  signIn: (phoneNumber: string) => Promise<{ verificationId: string }>;
  verifyOTP: (verificationId: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  linkLinkedin: () => Promise<void>;
  linkGoogle: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // In a real app, verify token with backend
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (phoneNumber: string): Promise<{ verificationId: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would be handled by Firebase Auth or similar
      const verificationId = 'mock_verification_id_' + Date.now();
      
      toast.success('OTP sent successfully!');
      return { verificationId };
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Failed to send OTP. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (verificationId: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful verification (in real app, verify with backend)
      if (otp === '123456' || otp.length === 6) {
        const mockUser: User = {
          id: 'user_' + Date.now(),
          phoneNumber: '+1234567890', // In real app, get from verification
          email: '',
          displayName: '',
          photoURL: '',
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          subscription: {
            type: 'free',
            postsRemaining: 1,
            maxPosts: 1,
            isActive: true
          },
          isLinkedinConnected: false,
          isGoogleConnected: false
        };

        // Store auth data
        const token = 'mock_token_' + Date.now();
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        setUser(mockUser);
        setIsAuthenticated(true);
        
        toast.success('Successfully signed in!');
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      toast.error('Invalid OTP. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const linkLinkedin = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate LinkedIn OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (user) {
        const updatedUser = {
          ...user,
          isLinkedinConnected: true,
          linkedinToken: 'mock_linkedin_token',
          updatedAt: new Date()
        };
        
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        toast.success('LinkedIn account connected successfully!');
      }
    } catch (error) {
      console.error('LinkedIn connection failed:', error);
      toast.error('Failed to connect LinkedIn. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (user) {
        const updatedUser = {
          ...user,
          isGoogleConnected: true,
          googleToken: 'mock_google_token',
          updatedAt: new Date()
        };
        
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        toast.success('Google account connected successfully!');
      }
    } catch (error) {
      console.error('Google connection failed:', error);
      toast.error('Failed to connect Google. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (user) {
        const updatedUser = {
          ...user,
          ...userData,
          updatedAt: new Date()
        };
        
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('User update failed:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    verifyOTP,
    signOut,
    linkLinkedin,
    linkGoogle,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
