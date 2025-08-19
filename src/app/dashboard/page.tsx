'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user, isLoading, isSignedIn, signOut, linkLinkedin, linkGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/auth');
    }
  }, [isLoading, isSignedIn, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      await linkLinkedin();
    } catch (error) {
      console.error('LinkedIn connection failed:', error);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await linkGoogle();
    } catch (error) {
      console.error('Google connection failed:', error);
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

  // Adapt to Firestore user schema (subscription: plan/status/postsUsed/postsLimit)
  const sub = user.subscription;
  const isPremium = sub.plan === 'premium';
  const isActivePlan = sub.status === 'active';
  const maxPostsRaw = sub.postsLimit; // -1 means unlimited for premium
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
      value: user.posts?.scheduled?.toString?.() || '0',
      subtitle: 'upcoming',
      icon: Icons.Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Total Posts',
      value: user.posts?.total?.toString?.() || '0',
      subtitle: 'published',
      icon: Icons.BarChart,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <Icons.LinkedIn size={20} color="white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">LinkPost</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.profile?.firstName || user.phoneNumber}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <Icons.LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your LinkedIn automation and track your progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="ml-2 text-sm text-gray-500">{stat.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with your LinkedIn automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/create-post">
                    <Button className="w-full h-20 flex flex-col space-y-2">
                      <Icons.Edit size={24} />
                      <span>Create Post</span>
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col space-y-2"
                    disabled
                  >
                    <Icons.Calendar size={24} />
                    <span>Schedule Posts</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col space-y-2"
                    disabled
                  >
                    <Icons.Newspaper size={24} />
                    <span>Browse News</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col space-y-2"
                    disabled
                  >
                    <Icons.BarChart size={24} />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>
                  Your latest LinkedIn posts and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Icons.Edit size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No posts yet</p>
                  <Link href="/create-post">
                    <Button>Create Your First Post</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Connections */}
            <Card>
              <CardHeader>
                <CardTitle>Account Connections</CardTitle>
                <CardDescription>
                  Connect your social media accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* LinkedIn Connection */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icons.LinkedIn size={24} color="#0077B5" />
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <p className="text-sm text-gray-500">
                        {user.connectedAccounts?.linkedin?.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  {user.connectedAccounts?.linkedin?.connected ? (
                    <div className="text-green-500">
                      <Icons.Check size={20} />
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleConnectLinkedIn}
                      loading={isLoading}
                    >
                      Connect
                    </Button>
                  )}
                </div>

                {/* Google Connection */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icons.Google size={24} />
                    <div>
                      <p className="font-medium">Google</p>
                      <p className="text-sm text-gray-500">
                        {user.connectedAccounts?.google?.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  {user.connectedAccounts?.google?.connected ? (
                    <div className="text-green-500">
                      <Icons.Check size={20} />
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleConnectGoogle}
                      loading={isLoading}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {isPremium ? (
                    <Icons.Crown size={32} className="mx-auto text-yellow-500 mb-3" />
                  ) : (
                    <Icons.Star size={32} className="mx-auto text-gray-400 mb-3" />
                  )}
                  
                  <h3 className="font-semibold text-lg">
                    {isPremium ? 'Premium Plan' : 'Free Trial'}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {displayPostsRemaining} of {displayMaxPosts} posts remaining
                  </p>

                  {!isPremium && (
                    <Link href="/pricing">
                      <Button className="w-full">
                        Upgrade to Premium
                        <br />
                        <span className="text-xs opacity-75">
                          {formatCurrency(100)} for 3 months
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Connect your LinkedIn account to start posting</li>
                  <li>• Use trending news for engaging content</li>
                  <li>• Schedule posts for optimal times</li>
                  <li>• Track performance with analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
