// Type definitions for the LinkPost application

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription: Subscription;
  linkedinToken?: string;
  googleToken?: string;
  isLinkedinConnected: boolean;
  isGoogleConnected: boolean;
}

export interface Subscription {
  type: 'free' | 'premium';
  startDate?: Date;
  endDate?: Date;
  postsRemaining: number;
  maxPosts: number;
  isActive: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  linkedinPostId?: string;
  createdAt: Date;
  updatedAt: Date;
  isGenerated: boolean;
  sourceNews?: NewsItem;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category: string;
  source: string;
  trending: boolean;
}

export interface Schedule {
  id: string;
  userId: string;
  days: number[]; // 0-6 (Sunday-Saturday)
  times: string[]; // HH:MM format
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
  quality: 'low' | 'medium' | 'high';
  filename: string;
  uploadedAt: Date;
}

export interface PostDraft {
  id: string;
  content: string;
  mediaFiles: MediaFile[];
  suggestedContent?: string;
  sourceNews?: NewsItem;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OTPVerificationData {
  phoneNumber: string;
  otp: string;
  verificationId: string;
}

export interface LinkedinAuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface GoogleAuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface PostGenerationRequest {
  newsItemId?: string;
  customPrompt?: string;
  tone: 'professional' | 'casual' | 'engaging' | 'thought-leadership';
  includeHashtags: boolean;
  includeEmojis: boolean;
  maxLength: number;
}

export interface PostAnalytics {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clickThroughRate: number;
  engagementRate: number;
  lastUpdated: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  postPublished: boolean;
  postFailed: boolean;
  subscriptionExpiring: boolean;
  weeklyReport: boolean;
}

export interface UserPreferences {
  timezone: string;
  language: string;
  defaultPostTone: PostGenerationRequest['tone'];
  autoApproveGenerated: boolean;
  notifications: NotificationPreferences;
}

// Form types
export interface PhoneAuthForm {
  phoneNumber: string;
}

export interface OTPForm {
  otp: string;
}

export interface CreatePostForm {
  content: string;
  scheduledDate: Date;
  includeMedia: boolean;
  mediaFiles?: File[];
}

export interface ScheduleForm {
  days: number[];
  times: string[];
  timezone: string;
}

// API endpoints types
export interface NewsApiResponse {
  articles: NewsItem[];
  totalResults: number;
  status: string;
}

export interface LinkedinApiResponse {
  success: boolean;
  postId?: string;
  error?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Component prop types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// Hook return types
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  linkLinkedin: () => Promise<void>;
  linkGoogle: () => Promise<void>;
}

export interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  createPost: (postData: CreatePostForm) => Promise<void>;
  updatePost: (id: string, postData: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  schedulePost: (id: string, scheduledDate: Date) => Promise<void>;
}
