# LinkPost Authentication System

## Overview

This LinkPost application now uses a comprehensive Firebase-based authentication system with email/password registration, Google Sign-In, and multi-step verification.

## Authentication Flow

### New Users
1. **Registration Form**: Users provide:
   - First Name
   - Last Name
   - Email Address
   - Phone Number
   - Password
   - Password Confirmation

2. **Post-Registration Verification Steps**:
   - **Step 1**: Email Verification - Users must verify their email address
   - **Step 2**: Phone Verification - Users must verify their phone number
   - **Step 3**: Google Account Connection (Optional) - Users can connect their Google account
   - **Step 4**: Complete - All verification steps are done

### Existing Users
1. **Login Options**:
   - Email and Password
   - Google Sign-In

## Features

### Firebase Integration
- **Firebase Auth**: Email/password and Google authentication
- **Firestore**: User data storage with structured schema
- **Email Verification**: Automatic email verification on registration
- **Phone Verification**: SMS-based phone number verification

### User Data Structure
```typescript
interface User {
  id: string;
  email: string;
  phoneNumber: string;
  profile: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  // ... other fields
}
```

### Security Features
- Password requirements (minimum 6 characters)
- Email verification required
- Phone verification required
- Google OAuth integration
- Secure session management

## Components

### Core Components
- `AuthProvider` - Main authentication context provider
- `VerificationSteps` - Multi-step verification component
- `AuthPage` - Combined login/registration page
- `DashboardPage` - Dashboard with verification flow

### File Structure
```
src/
├── contexts/
│   └── auth-context.tsx        # Main auth context
├── components/
│   └── auth/
│       └── VerificationSteps.tsx  # Verification flow
├── app/
│   ├── auth/
│   │   └── page.tsx            # Auth page
│   └── dashboard/
│       └── page.tsx            # Dashboard
├── lib/
│   └── firebase/
│       ├── config.ts           # Firebase config
│       └── users.ts            # User management functions
└── types/
    └── user.ts                 # User type definitions
```

## Environment Variables

Make sure these Firebase environment variables are set:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Firebase Setup Requirements

1. **Authentication Methods**: Enable Email/Password and Google in Firebase Console
2. **Firestore**: Set up Firestore database
3. **Google OAuth**: Configure Google OAuth credentials

## Usage

### Registration
```typescript
const { registerWithEmail } = useAuth();

await registerWithEmail({
  firstName: 'John',
  lastName: 'Doe', 
  email: 'john@example.com',
  phoneNumber: '+1234567890',
  password: 'securepassword'
});
```

### Login
```typescript
const { signInWithEmail, signInWithGoogle } = useAuth();

// Email login
await signInWithEmail('john@example.com', 'password');

// Google login  
await signInWithGoogle();
```

### Verification Steps
```typescript
const { getAuthSteps } = useAuth();
const steps = getAuthSteps();
// Returns array of verification steps with completion status
```

## Notes

- The old authentication system files are backed up with `-old` suffix
- Users must complete all verification steps to access the full dashboard
- Google connection is optional but recommended for enhanced features
- All authentication errors are handled with user-friendly toast messages
