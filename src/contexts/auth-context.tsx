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
  updateUserPhoneNumber,
  markEmailVerificationSent,
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
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import toast from 'react-hot-toast';

interface PhoneVerificationResult {
  verificationId: string;
}

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
  linkLinkedin: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | PhoneVerificationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        
        // Note: We don't load cached user data here anymore
        // We always fetch fresh data from the database to ensure verification status is current

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (!firebaseUser) {
            setUser(null);
            setIsSignedIn(false);
            localStorage.removeItem('user_data');
            setIsLoading(false);
            return;
          }

          try {
            let existingUser = await getUserById(firebaseUser.uid);
            
            if (!existingUser) {
              console.warn('Firebase user exists but no Firestore user found, attempting to create...');
              
              // Try to get user data from localStorage or create minimal user
              const storedUserData = localStorage.getItem('temp_user_data');
              if (storedUserData) {
                try {
                  const userData = JSON.parse(storedUserData);
                  existingUser = await createUserWithId(firebaseUser.uid, userData);
                  localStorage.removeItem('temp_user_data');
                  console.log('Created missing user document from stored data');
                } catch (createError) {
                  console.error('Failed to create user document:', createError);
                }
              }
              
              // If still no user, create with minimal Firebase Auth data
              if (!existingUser) {
                try {
                  const minimalUserData: CreateUserData = {
                    email: firebaseUser.email || '',
                    phoneNumber: firebaseUser.phoneNumber || '',
                    firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
                    lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || ''
                  };
                  existingUser = await createUserWithId(firebaseUser.uid, minimalUserData);
                  console.log('Created user document with Firebase Auth data');
                } catch (createError) {
                  console.error('Failed to create minimal user document:', createError);
                  toast.error('Account setup error. Please contact support.');
                  setUser(null);
                  setIsSignedIn(false);
                  setIsLoading(false);
                  return;
                }
              }
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

  // Periodic user data refresh to ensure verification status stays current
  // useEffect(() => {
  //   let refreshInterval: NodeJS.Timeout;

  //   if (isSignedIn && user) {
  //     // Refresh user data every 30 seconds to catch any database changes
  //     refreshInterval = setInterval(async () => {
  //       try {
  //         if (auth.currentUser) {
  //           const freshUserData = await getUserById(auth.currentUser.uid);
  //           if (freshUserData) {
  //             // Only update if there are actual changes to avoid unnecessary re-renders
  //             const currentUserString = JSON.stringify(user);
  //             const freshUserString = JSON.stringify(freshUserData);
  //             if (currentUserString !== freshUserString) {
  //               setUser(freshUserData);
  //               localStorage.setItem('user_data', JSON.stringify(freshUserData));
  //             }
  //           }
  //         }
  //       } catch (error) {
  //         console.error('Error during periodic user data refresh:', error);
  //       }
  //     }, 30000); // 30 seconds
  //   }

  //   return () => {
  //     if (refreshInterval) {
  //       clearInterval(refreshInterval);
  //     }
  //   };
  // }, [isSignedIn, user]);

  const registerWithEmail = async (data: CreateUserData & { password: string }): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Store user data temporarily in case Firestore creation fails
      const userData: CreateUserData = {
        email: data.email,
        phoneNumber: data.phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName
      };
      localStorage.setItem('temp_user_data', JSON.stringify(userData));
      
      // Create Firebase Auth user first - Firebase Auth will handle duplicate email checking
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Create Firestore user document
      try {
        await createUserWithId(userCredential.user.uid, userData);
        localStorage.removeItem('temp_user_data'); // Clean up on success
      } catch (firestoreError) {
        console.error('Firestore user creation failed:', firestoreError);
        // Don't throw - let the auth state handler create the document
      }
      
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
        
        // Re-fetch user to get the updated state
        existingUser = await getUserById(result.user.uid);
        
        toast.success('Account created with Google!');
      } else {
        // Update login timestamp for existing user
        await updateUserLogin(existingUser.id);
        toast.success('Signed in with Google!');
      }
      
      // Immediately update the auth state to prevent redirect
      setUser(existingUser);
      setIsSignedIn(true);
      localStorage.setItem('user_data', JSON.stringify(existingUser));
      
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
      
      // Check if this is a resend by looking at user's verification status
      const isResend = user?.verification?.emailVerificationSentAt;
      toast.success(isResend ? 'Verification email resent! Check your inbox.' : 'Verification email sent! Check your inbox.');
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
        
        // Re-fetch to confirm persistence (source of truth)
        const refreshed = await getUserById(auth.currentUser.uid);
        if (refreshed) {
          setUser(refreshed);
          localStorage.setItem('user_data', JSON.stringify(refreshed));
        }
        
        toast.success('Email verified successfully!');
      }
    } catch (error: unknown) {
      console.error('Email verification check error:', error);
    }
  };

  const sendPhoneVerificationCode = async (phoneNumber: string): Promise<void> => {
    try {
      if (!auth.currentUser || !user) {
        throw new Error('No user signed in');
      }

      // Ensure user document exists before proceeding
      const existingUser = await getUserById(auth.currentUser.uid);
      if (!existingUser) {
        throw new Error('User account not properly set up. Please contact support.');
      }

      // Initialize RecaptchaVerifier if not already done
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
        setRecaptchaVerifier(verifier);
      }

      // Get phone auth credential
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier!);
      
      // Store verification ID for later verification
      setConfirmationResult({ verificationId });
      
      // Update phone number in Firestore (but don't mark as verified yet)
      await updateUserPhoneNumber(auth.currentUser.uid, phoneNumber);
      
      // Update local state with phone number but keep verification false
      const updatedUser = { 
        ...user, 
        phoneNumber: phoneNumber
      };
      
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));

      toast.success('OTP sent to your phone number!');
      
    } catch (error: unknown) {
      console.error('Phone verification error:', error);
      const errorMessage = error && typeof error === 'object' && 'code' in error 
        ? `Phone verification failed: ${error.code}`
        : 'Failed to send verification code';
      toast.error(errorMessage);
      throw error;
    }
  };

  const verifyPhoneCode = async (code: string): Promise<void> => {
    try {
      if (!confirmationResult) {
        throw new Error('No verification in progress. Please request OTP first.');
      }
      
      if (!auth.currentUser || !user) {
        throw new Error('No user signed in');
      }

      // Ensure user document exists before proceeding
      const existingUser = await getUserById(auth.currentUser.uid);
      if (!existingUser) {
        throw new Error('User account not properly set up. Please contact support.');
      }

      // Create phone credential and link to existing user
      const credential = PhoneAuthProvider.credential(
        (confirmationResult as PhoneVerificationResult).verificationId, 
        code
      );
      
      // Link phone credential to existing email-based account
      await linkWithCredential(auth.currentUser, credential);
      
      // Mark phone as verified in Firestore
      await updatePhoneVerification(auth.currentUser.uid, true);
      
      // Re-fetch to confirm persistence (source of truth)
      const refreshed = await getUserById(auth.currentUser.uid);
      if (!refreshed?.verification.phoneVerified) {
        throw new Error('Phone verification failed to persist');
      }
      
      setUser(refreshed);
      localStorage.setItem('user_data', JSON.stringify(refreshed));
      
      // Clear confirmation result
      setConfirmationResult(null);
      
      toast.success('Phone number verified and linked successfully!');
    } catch (error: unknown) {
      console.error('Phone code verification error:', error);
      const errorMessage = error && typeof error === 'object' && 'code' in error 
        ? `Phone verification failed: ${error.code}`
        : 'Invalid verification code. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      
      // Clear all user data and state
      setUser(null);
      setIsSignedIn(false);
      setConfirmationResult(null);
      localStorage.removeItem('user_data');
      
      // Clear any auth cookies
      try {
        document.cookie = 'lp_authed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch {
        // Ignore cookie errors
      }
      
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
      
      // Verify that Google email matches the user's registered email
      if (result.user.email !== user.email) {
        throw new Error(`Google email (${result.user.email}) does not match your registered email (${user.email}). Please use the correct Google account.`);
      }
      
      const googleData = {
        accessToken: '', // You may need to get this from the credential
        email: result.user.email || '',
      };
      
      await connectOAuthAccount(auth.currentUser.uid, 'google', googleData);
      
      // Re-fetch to confirm persistence (source of truth)
      const refreshed = await getUserById(auth.currentUser.uid);
      if (!refreshed?.connectedAccounts.google?.connected) {
        throw new Error('Google connection failed to persist');
      }

      setUser(refreshed);
      localStorage.setItem('user_data', JSON.stringify(refreshed));
      
      toast.success('Google account linked successfully!');
    } catch (error: unknown) {
      console.error('Google link error:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Failed to link Google account';
      toast.error(message);
      throw error;
    }
  };

  const linkLinkedin = async (): Promise<void> => {
    try {
      if (!auth.currentUser || !user) {
        throw new Error('No user signed in');
      }

      setIsLoading(true);

      // Start LinkedIn OAuth flow
      const response = await fetch('/api/auth/linkedin?action=start');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start LinkedIn OAuth');
      }

      // Open LinkedIn OAuth in popup
      const authUrl = data.url;
      const popup = window.open(authUrl, 'linkedin_oauth', 'width=600,height=700');
      
      if (!popup) {
        throw new Error('Popup blocked - please allow popups for LinkedIn authentication');
      }

      // Listen for the OAuth callback response (single-use listener)
      const result = await new Promise<{
        accessToken: string;
        profile: { id: string; email?: string; [key: string]: unknown };
        refreshToken?: string;
        email?: string;
        scope?: string;
        expiresIn?: number;
      }>((resolve, reject) => {
        let settled = false;
        // when we get a valid message we mark settled; a brief grace period avoids race with close
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            try { popup.close(); } catch {}
            reject(new Error('LinkedIn authentication timed out'));
          }
        }, 1000 * 60); // 60s timeout

        const checkClosed = setInterval(() => {
          if (popup.closed && !settled) {
            // allow a 300ms grace period after close in case message just dispatched
            setTimeout(() => {
              if (!settled) {
                clearInterval(checkClosed);
                clearTimeout(timeout);
                settled = true;
                reject(new Error('LinkedIn authentication was cancelled'));
              }
            }, 300);
          }
        }, 400);

        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (settled) return;
          
          // Filter out React DevTools and other development tool messages
          if (event.data?.source === 'react-devtools-bridge' || 
              event.data?.source === 'react-devtools-content-script' ||
              event.data?.source === 'react-devtools-inject-script') {
            return;
          }
          
          // Only process messages that look like LinkedIn OAuth responses
          if (!event.data || typeof event.data !== 'object') {
            return;
          }
          
          // Check if this is a LinkedIn OAuth response (has error or success/accessToken)
          const isLinkedInResponse = event.data.error || event.data.success || event.data.accessToken;
          if (!isLinkedInResponse) {
            console.log('Ignoring non-LinkedIn message:', event.data);
            return;
          }
          
          console.log('LinkedIn OAuth response received:', event.data);
          
          settled = true;
          clearInterval(checkClosed);
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          try { popup.close(); } catch {}
          
          if (event.data.error) {
            reject(new Error(event.data.description || event.data.message || event.data.error));
          } else if (event.data.success || event.data.accessToken) {
            // Accept response if it has success flag OR accessToken (fallback)
            resolve(event.data);
          } else {
            console.error('Unexpected LinkedIn response structure:', event.data);
            reject(new Error('Unexpected LinkedIn response: ' + JSON.stringify(event.data)));
          }
        };
        window.addEventListener('message', messageHandler, { once: false });
      });

      // Prepare data for persistence
      const linkedinData = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || '',
        profileId: result.profile?.id || '',
        email: result.email || result.profile?.email || '',
        scope: result.scope || '',
        expiresIn: result.expiresIn || 0
      };

      // Ensure user doc exists
      let userDoc = await getUserById(auth.currentUser.uid);
      if (!userDoc) {
        const basicData = {
          email: auth.currentUser.email || '',
          firstName: auth.currentUser.displayName?.split(' ')[0] || 'User',
          lastName: auth.currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          phoneNumber: auth.currentUser.phoneNumber || ''
        };
        userDoc = await createUserWithId(auth.currentUser.uid, basicData);
      }

      // Persist LinkedIn connection
      await connectOAuthAccount(auth.currentUser.uid, 'linkedin', linkedinData);

      // Re-fetch to confirm persistence (source of truth)
      const refreshed = await getUserById(auth.currentUser.uid);
      if (!refreshed?.connectedAccounts.linkedin?.connected) {
        throw new Error('LinkedIn connection failed to persist');
      }

      setUser(refreshed);
      localStorage.setItem('user_data', JSON.stringify(refreshed));
      toast.success('LinkedIn account linked successfully');
    } catch (error: unknown) {
      console.error('LinkedIn link error:', error);
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Failed to link LinkedIn account';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    // Implementation for updating user data
    // This would call the updateUser function from users.ts
    console.log('Update user:', userData);
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user signed in');
      }

      // Fetch fresh user data from database
      const freshUserData = await getUserById(auth.currentUser.uid);
      if (freshUserData) {
        setUser(freshUserData);
        localStorage.setItem('user_data', JSON.stringify(freshUserData));
      } else {
        // If user doesn't exist in database, sign them out
        console.warn('User data not found in database, signing out');
        await signOut();
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
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
        step: 'linkedin-connection',
        completed: user.connectedAccounts.linkedin?.connected || false
      },
      {
        step: 'complete',
        completed: user.verification.emailVerified && 
                  user.verification.phoneVerified && 
                  (user.connectedAccounts.google?.connected || false) &&
                  (user.connectedAccounts.linkedin?.connected || false)
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
    linkLinkedin,
    updateUser,
    refreshUserData,
    getAuthSteps
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div id="recaptcha-container" className="fixed bottom-4 right-4 z-50"></div>
    </AuthContext.Provider>
  );
};
