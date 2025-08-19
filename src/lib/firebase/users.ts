// src/lib/firebase/users.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, CreateUserData, UpdateUserData } from '@/types/user';

export type { User, CreateUserData, UpdateUserData };

const USERS_COLLECTION = 'users';

// Create a new user document in Firestore
export async function createUser(userData: CreateUserData): Promise<User> {
  const userId = generateUserId();
  return createUserWithId(userId, userData);
}

// Create a new user document with a provided ID (e.g. Firebase Auth UID)
export async function createUserWithId(userId: string, userData: CreateUserData): Promise<User> {
  console.log('🏗️ createUserWithId called with:', { userId, userData });
  
  // Check if user with this ID already exists (shouldn't happen, but safety check)
  const existingById = await getUserById(userId);
  if (existingById) {
    console.log('⚠️ User with this ID already exists:', existingById);
    throw new Error('User with this ID already exists');
  }
  
  // Check if user with this phone number already exists
  const existingByPhone = await getUserByPhoneNumber(userData.phoneNumber);
  if (existingByPhone) {
    console.log('⚠️ User with this phone number already exists:', existingByPhone);
    throw new Error('User with this phone number already exists');
  }
  
  const now = new Date();
  console.log('📅 Creating user with timestamp:', now);
  
  const newUser: User = {
    id: userId,
    phoneNumber: userData.phoneNumber,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
    profile: {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      profilePicture: ''
    },
    subscription: {
      plan: 'free',
      status: 'active',
      postsUsed: 0,
      postsLimit: 1 // Free tier gets 1 post
    },
    connectedAccounts: {
      linkedin: {
        connected: false
      },
      google: {
        connected: false
      }
    },
    preferences: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    posts: {
      total: 0,
      published: 0,
      scheduled: 0,
      drafts: 0
    },
    isActive: true,
    lastActiveAt: now
  };

  console.log('💾 Saving new user to Firestore...');
  await setDoc(doc(db, USERS_COLLECTION, userId), {
    ...newUser,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp()
  });

  console.log('✅ New user saved to Firestore successfully');
  return newUser;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  console.log('🔍 getUserById called with:', userId);
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      console.log('❌ User not found by ID:', userId);
      return null;
    }

    console.log('✅ User found by ID:', userId);
    const data = userDoc.data();
    const user = {
      ...data,
      id: userDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
    } as User;
    console.log('📄 User data:', user);
    return user;
  } catch (error) {
    console.error('❌ Error getting user by ID:', error);
    return null;
  }
}

// Get user by phone number
export async function getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
  console.log('📞 getUserByPhoneNumber called with:', phoneNumber);
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('phoneNumber', '==', phoneNumber)
    );
    
    console.log('🔍 Querying Firestore for phone number...');
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No user found with phone number:', phoneNumber);
      return null;
    }

    console.log('✅ User found with phone number:', phoneNumber);
    console.log('📊 Query result size:', querySnapshot.size);
    
    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    
    const user = {
      ...data,
      id: userDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
    } as User;
    
    console.log('📄 User data:', user);
    return user;
  } catch (error) {
    console.error('❌ Error getting user by phone number:', error);
    return null;
  }
}

// Update user login timestamp
export async function updateUserLogin(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastLoginAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user login:', error);
    throw error;
  }
}

// Update user data
export async function updateUser(userId: string, updates: UpdateUserData): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Update user activity timestamp
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    // Don't throw error for activity updates to avoid disrupting user experience
  }
}

// Update subscription plan
export async function updateUserSubscription(
  userId: string, 
  plan: 'free' | 'premium',
  endDate?: Date
): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      'subscription.plan': plan,
      'subscription.status': 'active',
      'subscription.postsLimit': plan === 'premium' ? -1 : 1, // -1 means unlimited
      updatedAt: serverTimestamp()
    };

    if (plan === 'premium') {
      updates['subscription.startDate'] = serverTimestamp();
      if (endDate) {
        updates['subscription.endDate'] = endDate;
      }
    }

    await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Connect OAuth account
export async function connectOAuthAccount(
  userId: string,
  provider: 'linkedin' | 'google',
  accountData: {
    accessToken: string;
    refreshToken?: string;
    profileId?: string;
    email?: string;
  }
): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      [`connectedAccounts.${provider}`]: {
        connected: true,
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        profileId: accountData.profileId,
        email: accountData.email,
        connectedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
  } catch (error) {
    console.error(`Error connecting ${provider} account:`, error);
    throw error;
  }
}

// Increment post count
export async function incrementPostCount(userId: string, type: 'published' | 'scheduled' | 'drafts'): Promise<void> {
  try {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    const updates: Record<string, unknown> = {
      [`posts.${type}`]: user.posts[type] + 1,
      'posts.total': user.posts.total + 1,
      updatedAt: serverTimestamp()
    };

    if (type === 'published') {
      updates['subscription.postsUsed'] = user.subscription.postsUsed + 1;
    }

    await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
  } catch (error) {
    console.error('Error incrementing post count:', error);
    throw error;
  }
}

// Generate unique user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to check if user can create posts
export function canUserCreatePost(user: User): boolean {
  if (user.subscription.plan === 'premium') {
    return user.subscription.status === 'active';
  }
  
  // Free tier check
  return user.subscription.postsUsed < user.subscription.postsLimit;
}

// Helper function to get remaining posts for free users
export function getRemainingPosts(user: User): number {
  if (user.subscription.plan === 'premium') {
    return -1; // Unlimited
  }
  
  return Math.max(0, user.subscription.postsLimit - user.subscription.postsUsed);
}
