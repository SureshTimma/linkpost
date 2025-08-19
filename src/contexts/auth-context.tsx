"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, CreateUserData } from '@/types/user';
import { getUserByPhoneNumber, createUserWithId, updateUserLogin, updateUserActivity, connectOAuthAccount } from '@/lib/firebase/users';
import { auth } from '@/lib/firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, onAuthStateChanged, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean; // primary flag
  isAuthenticated: boolean; // alias for consumers expecting this name
}

// Backward + forward compatible context interface:
// - Old code used: sendOTP(phone), verifyOTP(otp)
// - New code (auth/page) expects: signIn(phone) -> { verificationId }, verifyOTP(verificationId, otp)
// We support both. verifyOTP uses a flexible arg list.
interface AuthContextType extends AuthState {
  // New API
  signIn: (phoneNumber: string) => Promise<{ verificationId: string }>;
  verifyOTP: (...args: string[]) => Promise<void>; // (otp) OR (verificationId, otp)
  // Legacy API (alias for signIn & verifyOTP)
  sendOTP: (phoneNumber: string) => Promise<void>;
  // Other actions
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let graceTimer: NodeJS.Timeout | null = null;
    setIsLoading(true);
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('Auth persistence setup failed:', err);
    }).finally(() => {
      // optimistic from cache
      try {
        const cached = localStorage.getItem('user_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setIsSignedIn(true);
        }
      } catch {}
      const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('lp_authed=1');
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[auth] onAuthStateChanged fired. user?', !!firebaseUser);
        if (!firebaseUser) {
          setUser(null);
          setIsSignedIn(false);
          localStorage.removeItem('user_data');
          if (graceTimer) clearTimeout(graceTimer);
          setIsLoading(false);
          return;
        }
        if (!firebaseUser.phoneNumber) {
          if (graceTimer) clearTimeout(graceTimer);
            setIsLoading(false);
            return;
        }
        try {
          let existingUser = await getUserByPhoneNumber(firebaseUser.phoneNumber);
          if (!existingUser) {
            const createUserData: CreateUserData = { phoneNumber: firebaseUser.phoneNumber, firstName: '', lastName: '', email: '' };
            existingUser = await createUserWithId(firebaseUser.uid, createUserData);
            toast.success('Welcome! Account created successfully');
          } else {
            await updateUserLogin(existingUser.id);
            if (!localStorage.getItem('user_data')) {
              toast.success('Welcome back!');
            }
          }
          setUser(existingUser);
          setIsSignedIn(true);
          localStorage.setItem('user_data', JSON.stringify(existingUser));
          await updateUserActivity(existingUser.id);
        } catch (e) {
          console.error('Auth state handler error:', e);
          toast.error('Authentication error');
        } finally {
          if (graceTimer) clearTimeout(graceTimer);
          setIsLoading(false);
        }
      });
      if (hasAuthCookie) {
        graceTimer = setTimeout(() => {
          if (!auth.currentUser) {
            setIsSignedIn(false);
            setUser(null);
          }
          setIsLoading(false);
        }, 2000);
      }
    });
    return () => {
      if (unsub) unsub();
      if (graceTimer) clearTimeout(graceTimer);
    };
  }, []);

  const getRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if (recaptchaRef.current) return recaptchaRef.current;
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, container, { size: 'invisible' });
      return recaptchaRef.current;
    } catch (e) {
      console.error('Recaptcha init failed:', e);
      return null;
    }
  };

  // New API: signIn returns verificationId; legacy sendOTP wraps it (no return)
  const signIn = async (phoneNumber: string): Promise<{ verificationId: string }> => {
    try {
      setIsLoading(true);
      const appVerifier = getRecaptcha();
      if (!appVerifier) throw new Error('ReCAPTCHA failed to initialize');
      const phoneRegex = /^\+\d{10,15}$/;
      if (!phoneRegex.test(phoneNumber)) throw new Error('Invalid phone number format. Use +[countrycode][number]');
      confirmationResultRef.current = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      toast.success('OTP sent');
      return { verificationId: confirmationResultRef.current.verificationId };
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
      toast.error(msg || 'Failed to send OTP');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phoneNumber: string) => { await signIn(phoneNumber); };

  // Flexible verifyOTP: verifyOTP(otp) OR verifyOTP(verificationId, otp)
  const verifyOTP = async (...args: string[]) => {
    const otp = args.length === 1 ? args[0] : args[1];
    if (!otp) throw new Error('OTP required');
    try {
      setIsLoading(true);
  if (!confirmationResultRef.current) throw new Error('No OTP in progress');
  await confirmationResultRef.current.confirm(otp);
      // Persist a simple cookie flag for faster optimistic auth on reload
      try {
        const expiryDays = 30;
        const exp = new Date(Date.now() + expiryDays * 86400000).toUTCString();
        document.cookie = `lp_authed=1; Expires=${exp}; Path=/; SameSite=Lax`;
      } catch (cookieErr) {
        console.warn('Failed to set auth cookie', cookieErr);
      }
      toast.success('Phone verified');
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
      toast.error(msg || 'Invalid OTP');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    console.log('👋 signOut called');
    try {
      setIsLoading(true);
      console.log('🔥 Signing out from Firebase Auth...');
      
      await firebaseSignOut(auth);
      console.log('✅ Firebase sign out successful');
      
      // Clear local storage
      console.log('🧹 Clearing localStorage...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Reset state (will also be handled by auth state listener)
      console.log('🔄 Resetting local state...');
      setUser(null);
      setIsSignedIn(false);
      
      // Clear recaptcha verifier
      if (recaptchaRef.current) {
        console.log('🧹 Clearing RecaptchaVerifier...');
        try {
          recaptchaRef.current.clear();
        } catch (e) {
          console.log('⚠️ RecaptchaVerifier clear failed (may already be cleared):', e);
        }
        recaptchaRef.current = null;
      }
      
      // Clear confirmation result
      confirmationResultRef.current = null;
      
      toast.success('Signed out successfully');
      console.log('✅ Sign out completed');
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const linkLinkedin = async (): Promise<void> => {
    if (!user) {
      toast.error('Sign in first');
      return;
    }
    try {
      setIsLoading(true);
      // Start OAuth flow via API (gets auth URL)
      const startRes = await fetch('/api/auth/linkedin?action=start');
      const startJson = await startRes.json();
      if (!startRes.ok) throw new Error(startJson.error || 'Failed to start OAuth');
      const authUrl: string = startJson.url;

      const popup = window.open(authUrl, 'linkedin_oauth', 'width=600,height=700');
      if (!popup) throw new Error('Popup blocked');

      // Poll for redirect completion by monitoring window URL (simple approach)
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(interval);
              reject(new Error('Popup closed'));
              return;
            }
            const url = popup.location.href;
            if (url.includes('/api/auth/linkedin/callback')) {
              const search = popup.location.search;
              const params = new URLSearchParams(search);
              const code = params.get('code');
              const state = params.get('state');
              const error = params.get('error');
              const errorDescription = params.get('error_description');
              
              console.log('[linkedin] callback params:', { code: !!code, state, error, errorDescription });
              
              if (error) {
                popup.close();
                clearInterval(interval);
                reject(new Error(`LinkedIn OAuth error: ${error} - ${errorDescription || 'Unknown error'}`));
                return;
              }
              
              if (!code) {
                popup.close();
                clearInterval(interval);
                reject(new Error('No authorization code returned from LinkedIn'));
                return;
              }

              // Wait for the page to load completely and check for success/error content
              try {
                const checkContent = async () => {
                  try {
                    const bodyText = popup.document?.body?.textContent || '';
                    
                    // Check if page shows success
                    if (bodyText.includes('"success":true') || bodyText.includes('"accessToken"')) {
                      popup.close();
                      clearInterval(interval);
                      
                      // Parse the response from the page
                      try {
                        const jsonMatch = bodyText.match(/\{.*\}/);
                        if (jsonMatch) {
                          const cbJson = JSON.parse(jsonMatch[0]);
                          console.log('LinkedIn OAuth response data:', cbJson);
                          
                          // Store LinkedIn tokens and profile data in Firestore
                          try {
                            await connectOAuthAccount(user.id, 'linkedin', {
                              accessToken: cbJson.accessToken,
                              refreshToken: cbJson.refreshToken,
                              profileId: cbJson.profile?.sub,
                              email: cbJson.profile?.email,
                              expiresIn: cbJson.expiresIn,
                              scope: cbJson.scope
                            });
                            console.log('LinkedIn tokens and profile stored in Firestore successfully');
                          } catch (firestoreError) {
                            console.error('Failed to store LinkedIn data in Firestore:', firestoreError);
                          }
                          
                          // Update user state
                          const updated: User = {
                            ...user,
                            connectedAccounts: {
                              ...user.connectedAccounts,
                              linkedin: {
                                connected: true,
                                accessToken: cbJson.accessToken,
                                profileId: cbJson.profile?.id,
                                connectedAt: new Date()
                              }
                            }
                          };
                          setUser(updated);
                          localStorage.setItem('user_data', JSON.stringify(updated));
                          toast.success('LinkedIn connected');
                          resolve();
                          return;
                        }
                      } catch {
                        // If parsing fails, still treat as success
                        const updated: User = {
                          ...user,
                          connectedAccounts: {
                            ...user.connectedAccounts,
                            linkedin: {
                              connected: true,
                              connectedAt: new Date()
                            }
                          }
                        };
                        setUser(updated);
                        localStorage.setItem('user_data', JSON.stringify(updated));
                        toast.success('LinkedIn connected');
                        resolve();
                        return;
                      }
                    }
                    
                    // Check if page shows error
                    if (bodyText.includes('"error"') || bodyText.includes('error')) {
                      popup.close();
                      clearInterval(interval);
                      reject(new Error('LinkedIn OAuth failed'));
                      return;
                    }
                  } catch {
                    // Can't access popup content (CORS), wait for it to load more
                  }
                };
                
                // Check immediately and then poll
                await checkContent();
                setTimeout(() => checkContent(), 500);
                setTimeout(() => checkContent(), 1000);
                setTimeout(() => checkContent(), 2000);
                
              } catch {
                popup.close();
                clearInterval(interval);
                reject(new Error('OAuth process failed'));
              }
            }
          } catch {
            // Ignore cross-origin until redirected back
          }
        }, 700);
        // Safety timeout
        setTimeout(() => {
          clearInterval(interval);
          try { popup.close(); } catch {}
          reject(new Error('OAuth timeout'));
        }, 1000 * 90);
      });
    } catch (error: unknown) {
      console.error('LinkedIn connection failed:', error);
      const msg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : 'Failed to connect LinkedIn';
  toast.error(msg || 'Failed to connect LinkedIn');
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (user) {
        const updatedUser: User = {
          ...user,
          connectedAccounts: {
            ...user.connectedAccounts,
            google: {
              connected: true,
              accessToken: 'mock_google_token',
              email: 'user@gmail.com',
              connectedAt: new Date()
            }
          }
        };
        
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        toast.success('Google account connected!');
      }
      
    } catch (error) {
      console.error('Google connection failed:', error);
      toast.error('Failed to connect Google');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('User update failed:', error);
      toast.error('Failed to update user');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    isAuthenticated: isSignedIn,
    signIn,
    sendOTP,
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