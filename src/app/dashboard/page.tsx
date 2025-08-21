'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import VerificationSteps from '@/components/auth/VerificationSteps';

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  type: string;
  createdAt: string;
  publishedAt?: string;
  scheduleDate?: string;
}

interface PostsData {
  publishedPosts: Post[];
  scheduledPosts: Post[];
  stats: {
    totalPublished: number;
    totalScheduled: number;
  };
}

const NewDashboardPage: React.FC = () => {
  const { user, isLoading, isSignedIn, signOut, getAuthSteps, refreshUserData } = useAuth();
  const router = useRouter();
  const [postsData, setPostsData] = useState<PostsData | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);

  // Fetch user posts
  const fetchPosts = useCallback(async () => {
    if (!user || !isSignedIn) return;
    
    setPostsLoading(true);
    try {
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPostsData(data);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [user, isSignedIn]);

  // Fetch posts when user is available
  useEffect(() => {
    if (user && isSignedIn) {
      fetchPosts();
    }
  }, [user, isSignedIn, fetchPosts]);

  // Refresh posts when returning to dashboard (useful after creating a post)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isSignedIn) {
        fetchPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isSignedIn, fetchPosts]);

  // Smart refresh user data - only refresh when actually needed
  useEffect(() => {
    const smartRefreshData = async () => {
      if (!isSignedIn || !user) return;

      try {
        // Check when we last refreshed data
        const lastRefresh = localStorage.getItem('dashboard_last_refresh');
        const lastRefreshTime = lastRefresh ? parseInt(lastRefresh) : 0;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        // Only refresh if:
        // 1. User is not fully verified (verification status might change)
        // 2. Data is older than 5 minutes
        // 3. This is the first load (no cached timestamp)
        const needsVerification = !user.verification?.emailVerified || !user.verification?.phoneVerified;
        const dataIsStale = lastRefreshTime < fiveMinutesAgo;
        const isFirstLoad = !lastRefresh;

        if (needsVerification || dataIsStale || isFirstLoad) {
          console.log('Dashboard: Refreshing user data - verification needed or data stale');
          await refreshUserData();
          localStorage.setItem('dashboard_last_refresh', Date.now().toString());
        } else {
          console.log('Dashboard: Skipping refresh - user verified and data is recent');
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };

    smartRefreshData();
  }, [isSignedIn, user, refreshUserData]); // Keep original dependencies

  useEffect(() => {
    // Only redirect if auth is definitely not loading and user is not signed in
    // Add a slight delay to handle race conditions between auth state changes
    if (!isLoading && !isSignedIn && !user) {
      const timeoutId = setTimeout(() => {
        // Double-check the state hasn't changed during the timeout
        if (!isSignedIn && !user) {
          router.replace('/auth');
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isSignedIn, user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      // Always redirect to home page regardless of success/failure
      // Use replace to prevent going back to dashboard
      router.replace('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.Spinner size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const authSteps = getAuthSteps();
  const allStepsCompleted = authSteps.find(step => step.step === 'complete')?.completed || false;

  // If verification is not complete, show verification steps
  if (!allStepsCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-700 rounded-lg flex items-center justify-center mr-3">
                  <Icons.LinkedIn size={20} color="white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">LinkPost</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user.profile.firstName} {user.profile.lastName}
                </span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <Icons.LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Account Setup
            </h2>
            <p className="text-gray-600">
              We need to verify a few things before you can start using LinkPost.
            </p>
          </div>
          
          <div className="flex justify-center">
            <VerificationSteps />
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content (when verification is complete)
  // Adapt to new user schema
  const sub = user.subscription;
  const isPremium = sub.plan === 'premium';
  const isActivePlan = sub.status === 'active';
  const maxPostsRaw = sub.postsLimit;
  const postsRemainingRaw = isPremium
    ? -1 // unlimited
    : Math.max(0, sub.postsLimit - sub.postsUsed);
  const displayMaxPosts = maxPostsRaw === -1 ? '∞' : maxPostsRaw.toString();
  const displayPostsRemaining = postsRemainingRaw === -1 ? '∞' : postsRemainingRaw.toString();

  const stats = [
    {
      title: 'Posts Remaining',
      value: displayPostsRemaining,
      subtitle: `of ${displayMaxPosts}`,
      icon: Icons.Edit,
      color: 'text-blue-600'
    },
    {
      title: 'Plan Status',
      value: isPremium ? 'Premium' : 'Free',
      subtitle: isActivePlan ? 'Active' : 'Inactive',
      icon: isPremium ? Icons.Crown : Icons.Star,
      color: isPremium ? 'text-yellow-600' : 'text-gray-600'
    },
    {
      title: 'Scheduled Posts',
      value: postsLoading ? '...' : (postsData?.stats.totalScheduled?.toString() || '0'),
      subtitle: 'upcoming',
      icon: Icons.Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Total Posts',
      value: postsLoading ? '...' : (postsData?.stats.totalPublished?.toString() || '0'),
      subtitle: 'published',
      icon: Icons.BarChart,
      color: 'text-purple-600'
    }
  ];

  const canPost = isPremium || postsRemainingRaw > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-700 rounded-lg flex items-center justify-center mr-3">
                <Icons.LinkedIn size={20} color="white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">LinkPost</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.profile.firstName} {user.profile.lastName}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <Icons.LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.profile.firstName}!
          </h2>
          <p className="text-gray-600">
            Ready to create and schedule your next LinkedIn post?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stat.subtitle}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create Post Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icons.Edit className="mr-2" size={20} />
                Create New Post
              </CardTitle>
              <CardDescription>
                {canPost 
                  ? 'Start crafting your next LinkedIn post'
                  : 'Upgrade to premium to create unlimited posts'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {canPost ? (
                  <Link href="/create-post">
                    <Button className="w-full">
                      <Icons.Edit size={16} className="mr-2" />
                      Create Post
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        You&apos;ve used all your free posts for this period. Upgrade to premium for unlimited posting.
                      </p>
                    </div>
                    <Link href="/pricing">
                      <Button className="w-full">
                        <Icons.Crown size={16} className="mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icons.User className="mr-2" size={20} />
                Account Status
              </CardTitle>
              <CardDescription>
                Your account verification and connection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <div className="flex items-center">
                    <Icons.Check size={16} className="text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phone Verified</span>
                  <div className="flex items-center">
                    <Icons.Check size={16} className="text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Google Connected</span>
                  <div className="flex items-center">
                    {user.connectedAccounts.google?.connected ? (
                      <>
                        <Icons.Check size={16} className="text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <Icons.Close size={16} className="text-red-500 mr-1" />
                        <span className="text-sm text-red-600">Required</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">LinkedIn Connected</span>
                  <div className="flex items-center">
                    {user.connectedAccounts.linkedin?.connected ? (
                      <>
                        <Icons.Check size={16} className="text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <Icons.Close size={16} className="text-red-500 mr-1" />
                        <span className="text-sm text-red-600">Required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icons.Clock className="mr-2" size={20} />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest posts and account activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="text-center py-8">
                <Icons.Spinner className="animate-spin mx-auto text-gray-400 mb-4" size={32} />
                <p className="text-gray-500">Loading posts...</p>
              </div>
            ) : postsData && (postsData.publishedPosts.length > 0 || postsData.scheduledPosts.length > 0) ? (
              <div className="space-y-4">
                {/* Published Posts */}
                {postsData.publishedPosts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Recently Published</h4>
                    <div className="space-y-3">
                      {postsData.publishedPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icons.Check size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {post.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Icons.LinkedIn size={12} className="mr-1" />
                              <span>Published on {new Date(post.publishedAt!).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Posts */}
                {postsData.scheduledPosts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Upcoming Posts</h4>
                    <div className="space-y-3">
                      {postsData.scheduledPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icons.Calendar size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {post.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Icons.Clock size={12} className="mr-1" />
                              <span>Scheduled for {new Date(post.scheduleDate!).toLocaleDateString()} at {new Date(post.scheduleDate!).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icons.Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No recent activity to show</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your posts and scheduling activity will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewDashboardPage;
