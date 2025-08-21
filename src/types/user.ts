// src/types/user.ts
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  lastLoginAt: Date;
  updatedAt: Date;
  profile: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    emailVerificationSentAt?: Date;
    phoneVerificationSentAt?: Date;
  };
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'expired';
    startDate?: Date;
    endDate?: Date;
    postsUsed: number;
    postsLimit: number;
  };
  connectedAccounts: {
    linkedin?: {
      connected: boolean;
      accessToken?: string;
      refreshToken?: string;
      profileId?: string;
      connectedAt?: Date;
      profile?: {
        name?: string;
        picture?: string;
        headline?: string;
        email?: string;
      };
    };
    google?: {
      connected: boolean;
      accessToken?: string;
      refreshToken?: string;
      email?: string;
      connectedAt?: Date;
    };
  };
  preferences: {
    timezone: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  posts: {
    total: number;
    published: number;
    scheduled: number;
    drafts: number;
  };
  isActive: boolean;
  lastActiveAt: Date;
}

export interface CreateUserData {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserData {
  profile?: Partial<User['profile']>;
  preferences?: Partial<User['preferences']>;
  connectedAccounts?: Partial<User['connectedAccounts']>;
  verification?: Partial<User['verification']>;
}

export interface AuthStep {
  step: 'email-verification' | 'phone-verification' | 'google-connection' | 'linkedin-connection' | 'complete';
  completed: boolean;
}
