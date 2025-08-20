// src/app/dashboard/optimized-page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import VerificationSteps from '@/components/auth/VerificationSteps';

const OptimizedDashboardPage: React.FC = () => {
  const { user, isLoading, isSignedIn, signOut, getAuthSteps, refreshUserData } = useAuth();
  const router = useRouter();
  const [hasRefreshedOnMount, setHasRefreshedOnMount] = useState(false);

  // Smart refresh - only refresh if data is stale or on specific conditions
  const smartRefresh = useCallback(async () => {
    if (!isSignedIn || !user || hasRefreshedOnMount) return;

    try {
      // Only refresh if:
      // 1. User verification status might have changed
      // 2. It's been more than 5 minutes since last refresh
      const lastRefresh = localStorage.getItem('last_user_refresh');
      const lastRefreshTime = lastRefresh ? parseInt(lastRefresh) : 0;
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

      const shouldRefresh = 
        !user.verification.emailVerified || 
        !user.verification.phoneVerified ||
        lastRefreshTime < fiveMinutesAgo;

      if (shouldRefresh) {
        console.log('Smart refresh: Refreshing user data due to verification status or time');
        await refreshUserData();
        localStorage.setItem('last_user_refresh', Date.now().toString());
      } else {
        console.log('Smart refresh: Skipping refresh - data is recent and user is verified');
      }
      
      setHasRefreshedOnMount(true);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      setHasRefreshedOnMount(true);
    }
  }, [isSignedIn, user, refreshUserData, hasRefreshedOnMount]);

  // Only refresh on mount with smart logic
  useEffect(() => {
    smartRefresh();
  }, [smartRefresh]);

  // Simplified redirect logic with debouncing
  useEffect(() => {
    if (!isLoading && !isSignedIn && !user) {
      // Add a small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        if (!isSignedIn && !user) {
          router.replace('/auth');
        }
      }, 100); // Reduced from 200ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isSignedIn, user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear refresh tracking
      localStorage.removeItem('last_user_refresh');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth required state
  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const authSteps = getAuthSteps();
  const completedSteps = authSteps.filter(step => step.completed).length;
  const isFullyVerified = completedSteps === authSteps.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">LinkPost Dashboard</h1>
              {!isFullyVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Setup Required
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.profile?.firstName || 'User'}!
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <Icons.logout className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Verification Status */}
          {!isFullyVerified && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icons.settings className="h-5 w-5" />
                    <span>Complete Your Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Complete these steps to start using LinkPost ({completedSteps}/{authSteps.length} completed)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VerificationSteps />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Created:</span>
                  <span className="font-medium">{user.posts?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Published:</span>
                  <span className="font-medium">{user.posts?.published || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium capitalize">{user.subscription?.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Used:</span>
                  <span className="font-medium">
                    {user.subscription?.postsUsed || 0}/{user.subscription?.postsLimit || 1}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create-post" className="block">
                  <Button className="w-full" disabled={!isFullyVerified}>
                    <Icons.plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </Link>
                <Link href="/pricing" className="block">
                  <Button variant="outline" className="w-full">
                    <Icons.crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Verified:</span>
                  <span className={`font-medium ${user.verification?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user.verification?.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phone Verified:</span>
                  <span className={`font-medium ${user.verification?.phoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user.verification?.phoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">LinkedIn Connected:</span>
                  <span className={`font-medium ${user.connectedAccounts?.linkedin?.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {user.connectedAccounts?.linkedin?.connected ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          {isFullyVerified && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>🎉 You're all set!</CardTitle>
                  <CardDescription>
                    Your account is fully verified and ready to use. Start creating amazing LinkedIn posts!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/create-post">
                    <Button size="lg" className="w-full sm:w-auto">
                      Create Your First Post
                      <Icons.arrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OptimizedDashboardPage;
