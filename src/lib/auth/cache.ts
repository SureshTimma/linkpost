// src/lib/auth/cache.ts
import { User } from '@/types/user';

interface CachedUserData {
  user: User | null;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface AuthCache {
  userData: CachedUserData | null;
  authState: {
    isSignedIn: boolean;
    timestamp: number;
  } | null;
}

class AuthCacheManager {
  private static instance: AuthCacheManager;
  private cache: AuthCache = {
    userData: null,
    authState: null
  };

  // Cache TTL configurations (in milliseconds)
  private readonly USER_DATA_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly AUTH_STATE_TTL = 1 * 60 * 1000; // 1 minute

  public static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager();
    }
    return AuthCacheManager.instance;
  }

  public getCachedUserData(): User | null {
    if (!this.cache.userData) return null;
    
    const now = Date.now();
    if (now - this.cache.userData.timestamp > this.cache.userData.ttl) {
      this.cache.userData = null;
      return null;
    }
    
    return this.cache.userData.user;
  }

  public setCachedUserData(user: User | null): void {
    this.cache.userData = {
      user,
      timestamp: Date.now(),
      ttl: this.USER_DATA_TTL
    };
  }

  public getCachedAuthState(): boolean | null {
    if (!this.cache.authState) return null;
    
    const now = Date.now();
    if (now - this.cache.authState.timestamp > this.AUTH_STATE_TTL) {
      this.cache.authState = null;
      return null;
    }
    
    return this.cache.authState.isSignedIn;
  }

  public setCachedAuthState(isSignedIn: boolean): void {
    this.cache.authState = {
      isSignedIn,
      timestamp: Date.now()
    };
  }

  public clearCache(): void {
    this.cache = {
      userData: null,
      authState: null
    };
  }

  public invalidateUserData(): void {
    this.cache.userData = null;
  }

  public shouldRefreshUserData(): boolean {
    if (!this.cache.userData) return true;
    
    const now = Date.now();
    const timeSinceLastFetch = now - this.cache.userData.timestamp;
    
    // Refresh if data is older than TTL or if it's been more than 2 minutes
    return timeSinceLastFetch > Math.min(this.cache.userData.ttl, 2 * 60 * 1000);
  }
}

export default AuthCacheManager;
