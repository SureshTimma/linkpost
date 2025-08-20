"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, CreateUserData, AuthStep } from '@/types/user';
import { 
  getUserById, 
  createUserWithId, 
  updateUserLogin, 
  updateUserActivity,
  updateEmailVerification,
  updatePhoneVerification,
  markEmailVerificationSent,
  markPhoneVerificationSent,
  connectOAuthAccount 
} from '@/lib/firebase/users';
import { auth, googleProvider } from '@/lib/firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  // Registration
  registerWithEmail: (data: CreateUserData & { password: string }) => Promise<void>;
  
  // Login
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  
  // Verification
  sendEmailVerificationLink: () => Promise<void>;
  checkEmailVerificationStatus: () => Promise<void>;
  sendPhoneVerificationCode: (phoneNumber: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  
  // Account management
  signOut: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  
  // Verification status
  getAuthSteps: () => AuthStep[];
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
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        
        // Check for cached user data
        try {
          const cached = localStorage.getItem('user_data');
          if (cached) {
            const parsed = JSON.parse(cached);
            setUser(parsed);
            setIsSignedIn(true);
          }
        } catch {}

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (!firebaseUser) {
            setUser(null);
            setIsSignedIn(false);
            localStorage.removeItem('user_data');
            setIsLoading(false);
            return;
          }

          try {
            const existingUser = await getUserById(firebaseUser.uid);
            
            if (!existingUser) {
              // This shouldn't happen with our new flow, but handle gracefully
              console.warn('Firebase user exists but no Firestore user found');
              setUser(null);
              setIsSignedIn(false);
              setIsLoading(false);
              return;
            }

            // Sync email verification status from Firebase Auth to Firestore
            if (firebaseUser.emailVerified && !existingUser.verification.emailVerified) {
              await updateEmailVerification(firebaseUser.uid, true);
              existingUser.verification.emailVerified = true; // Update local state
            }

            // Update login timestamp
            await updateUserLogin(existingUser.id);
            
            setUser(existingUser);
            setIsSignedIn(true);
            localStorage.setItem('user_data', JSON.stringify(existingUser));
            
            // Update activity
            await updateUserActivity(existingUser.id);
            
            if (!localStorage.getItem('user_data')) {
              toast.success('Welcome back!');
            }
          } catch (error) {
            console.error('Auth state handler error:', error);
            toast.error('Authentication error');
          } finally {
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const registerWithEmail = async (data: CreateUserData & { password: string }): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Create Firebase Auth user first - Firebase Auth will handle duplicate email checking
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Create Firestore user document
      const userData: CreateUserData = {
        email: data.email,
        phoneNumber: data.phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName
      };
      
      await createUserWithId(userCredential.user.uid, userData);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      await markEmailVerificationSent(userCredential.user.uid);
      
      toast.success('Account created! Please check your email for verification.');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const message = error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use' 
        ? 'An account with this email already exists'
        : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to create account');
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      const message = error && typeof error === 'object' && 'code' in error && 
        (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')
        ? 'Invalid email or password'
        : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to sign in');
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists in Firestore
      let existingUser = await getUserById(result.user.uid);
      
      if (!existingUser) {
        // Create new user from Google data
        const userData: CreateUserData = {
          email: result.user.email || '',
          phoneNumber: '', // Will be filled during verification
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || ''
        };
        
        existingUser = await createUserWithId(result.user.uid, userData);
        
        // Mark email as verified since it's from Google
        if (result.user.emailVerified) {
          await updateEmailVerification(result.user.uid, true);
        }
        
        // Connect Google account
        const googleData = {
          accessToken: '', // You may need to get this from the credential
          email: result.user.email || '',
        };
        await connectOAuthAccount(result.user.uid, 'google', googleData);
        
        toast.success('Account created with Google!');
      } else {
        toast.success('Signed in with Google!');
      }
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
      const message = error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-closed-by-user'
        ? 'Sign in was cancelled'
        : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to sign in with Google');
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerificationLink = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }
      
      await sendEmailVerification(auth.currentUser);
      await markEmailVerificationSent(auth.currentUser.uid);
      toast.success('Verification email sent!');
    } catch (error: unknown) {
      console.error('Email verification error:', error);
      toast.error('Failed to send verification email');
      throw error;
    }
  };

  const checkEmailVerificationStatus = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }
      
      // Reload the user to get fresh data from Firebase
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified && user && !user.verification.emailVerified) {
        // Update Firestore and local state
        await updateEmailVerification(auth.currentUser.uid, true);
        
        // Update local user state
        const updatedUser = { ...user };
        updatedUser.verification.emailVerified = true;
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        toast.success('Email verified successfully!');
      }
    } catch (error: unknown) {
      console.error('Email verification check error:', error);
    }
  };

  const sendPhoneVerificationCode = async (phoneNumber: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      // Create recaptcha verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });

      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      await markPhoneVerificationSent(auth.currentUser.uid);
      toast.success('Verification code sent to your phone!');
    } catch (error: unknown) {
      console.error('Phone verification error:', error);
      toast.error('Failed to send verification code');
      throw error;
    }
  };

  const verifyPhoneCode = async (code: string): Promise<void> => {
    try {
      if (!confirmationResult) {
        throw new Error('No verification in progress');
      }
      
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      await confirmationResult.confirm(code);
      await updatePhoneVerification(auth.currentUser.uid, true);
      setConfirmationResult(null);
      toast.success('Phone number verified!');
    } catch (error: unknown) {
      console.error('Phone code verification error:', error);
      toast.error('Invalid verification code');
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setIsSignedIn(false);
      setConfirmationResult(null);
      localStorage.removeItem('user_data');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogleAccount = async (): Promise<void> => {
    try {
      if (!auth.currentUser || !user) {
        throw new Error('No user signed in');
      }

      const result = await signInWithPopup(auth, googleProvider);
      
      const googleData = {
        accessToken: '', // You may need to get this from the credential
        email: result.user.email || '',
      };
      
      await connectOAuthAccount(auth.currentUser.uid, 'google', googleData);
      toast.success('Google account linked successfully!');
    } catch (error: unknown) {
      console.error('Google link error:', error);
      toast.error('Failed to link Google account');
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    // Implementation for updating user data
    // This would call the updateUser function from users.ts
    console.log('Update user:', userData);
  };

  const getAuthSteps = (): AuthStep[] => {
    if (!user) return [];

    return [
      {
        step: 'email-verification',
        completed: user.verification.emailVerified
      },
      {
        step: 'phone-verification',
        completed: user.verification.phoneVerified
      },
      {
        step: 'google-connection',
        completed: user.connectedAccounts.google?.connected || false
      },
      {
        step: 'complete',
        completed: user.verification.emailVerified && 
                  user.verification.phoneVerified && 
                  (user.connectedAccounts.google?.connected || false)
      }
    ];
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    isAuthenticated: isSignedIn,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    sendEmailVerificationLink,
    checkEmailVerificationStatus,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    signOut,
    linkGoogleAccount,
    updateUser,
    getAuthSteps
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div id="recaptcha-container" className="hidden"></div>
    </AuthContext.Provider>
  );
};
