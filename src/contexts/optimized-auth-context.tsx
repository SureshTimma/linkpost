// src/contexts/optimized-auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User, CreateUserData } from '@/types/user';
import { getUserById, createUserWithId } from '@/lib/firebase/users';
import AuthCacheManager from '@/lib/auth/cache';
import { AuthStep, UseAuthReturn, PhoneVerificationResult } from '@/types';

interface AuthContextType extends UseAuthReturn {}

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

export const OptimizedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | PhoneVerificationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  
  const cacheManager = AuthCacheManager.getInstance();

  // Optimized user data refresh with caching
  const refreshUserData = useCallback(async (force: boolean = false): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      // Check cache first unless forced refresh
      if (!force && !cacheManager.shouldRefreshUserData()) {
        const cachedUser = cacheManager.getCachedUserData();
        if (cachedUser) {
          setUser(cachedUser);
          return;
        }
      }

      console.log('Fetching fresh user data from Firestore...');
      const freshUserData = await getUserById(auth.currentUser.uid);
      
      if (freshUserData) {
        setUser(freshUserData);
        cacheManager.setCachedUserData(freshUserData);
        localStorage.setItem('user_data', JSON.stringify(freshUserData));
      } else {
        console.warn('User data not found in database, signing out');
        await signOut();
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  }, [cacheManager]);

  // Initialize auth with caching
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isInitialized = false;

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        
        // Try to load from cache first for faster initial load
        const cachedAuthState = cacheManager.getCachedAuthState();
        const cachedUserData = cacheManager.getCachedUserData();
        
        if (cachedAuthState !== null && cachedUserData) {
          setIsSignedIn(cachedAuthState);
          setUser(cachedUserData);
          setIsLoading(false);
          console.log('Loaded user data from cache');
        }

        // Set up auth state listener (this is what causes the Listen requests)
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          // Prevent multiple rapid calls during initialization
          if (isInitialized && firebaseUser === auth.currentUser) {
            return;
          }
          
          console.log('Auth state changed:', firebaseUser ? 'signed in' : 'signed out');
          
          if (!firebaseUser) {
            setUser(null);
            setIsSignedIn(false);
            cacheManager.clearCache();
            localStorage.removeItem('user_data');
            setIsLoading(false);
            return;
          }

          try {
            // Only fetch if we don't have cached data or if user ID changed
            const currentUserId = user?.id;
            if (!currentUserId || currentUserId !== firebaseUser.uid) {
              await refreshUserData(true); // Force refresh for new user
            }
            
            setIsSignedIn(true);
            cacheManager.setCachedAuthState(true);
          } catch (error) {
            console.error('Error handling auth state change:', error);
            setUser(null);
            setIsSignedIn(false);
            cacheManager.clearCache();
          } finally {
            setIsLoading(false);
            isInitialized = true;
          }
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshUserData, user?.id, cacheManager]);

  // Rest of your auth methods with optimizations...
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsSignedIn(false);
      cacheManager.clearCache();
      localStorage.removeItem('user_data');
      localStorage.removeItem('temp_user_data');
      
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Optimized verification status check
  const getAuthSteps = useCallback((): AuthStep[] => {
    if (!user) return [];

    return [
      {
        step: 'email-verification',
        label: 'Verify Email',
        completed: user.verification.emailVerified,
        description: 'Click the link in your email to verify your account'
      },
      {
        step: 'phone-verification', 
        label: 'Verify Phone',
        completed: user.verification.phoneVerified,
        description: 'Enter the code sent to your phone number'
      },
      {
        step: 'profile-completion',
        label: 'Complete Profile',
        completed: !!(user.profile.firstName && user.profile.lastName),
        description: 'Add your name and profile information'
      },
      {
        step: 'linkedin-connection',
        label: 'Connect LinkedIn',
        completed: user.connectedAccounts.linkedin.connected,
        description: 'Connect your LinkedIn account to start posting'
      }
    ];
  }, [user]);

  // Placeholder implementations for other methods
  const sendOTP = async (phoneNumber: string): Promise<void> => {
    // Implementation here...
    console.log('sendOTP called for:', phoneNumber);
  };

  const verifyOTP = async (code: string): Promise<void> => {
    // Implementation here...
    console.log('verifyOTP called with code:', code);
  };

  const linkLinkedin = async (): Promise<void> => {
    // Implementation here...
    console.log('linkLinkedin called');
  };

  const linkGoogle = async (): Promise<void> => {
    // Implementation here...
    console.log('linkGoogle called');
  };

  const sendEmailVerification = async (): Promise<void> => {
    // Implementation here...
    console.log('sendEmailVerification called');
  };

  const updateUser = async (userData: Partial<CreateUserData>): Promise<void> => {
    // Implementation here...
    console.log('updateUser called with:', userData);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    isAuthenticated: isSignedIn,
    confirmationResult,
    sendOTP,
    verifyOTP,
    signOut,
    linkLinkedin,
    linkGoogle,
    sendEmailVerification,
    updateUser,
    refreshUserData: () => refreshUserData(false), // Default to non-forced refresh
    getAuthSteps
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
