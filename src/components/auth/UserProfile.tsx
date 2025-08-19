'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const UserProfile: React.FC = () => {
  const { user, signOut, linkLinkedin, linkGoogle, isLoading } = useAuth();

  if (!user) {
    return null;
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            User Profile
          </h2>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
          >
            Sign Out
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded-lg border">
                  {user.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {user.phoneNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {user.profile?.firstName || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {user.profile?.lastName || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {user.profile?.email || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Login
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formatDate(user.lastLoginAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Updated
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Activity
                </label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border">
                  {formatDate(user.lastActiveAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Connected Accounts
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Li</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">LinkedIn</p>
                    <p className="text-sm text-gray-600">
                      {user.connectedAccounts?.linkedin?.connected 
                        ? `Connected ${formatDate(user.connectedAccounts.linkedin.connectedAt)}`
                        : 'Not connected'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={linkLinkedin}
                  disabled={isLoading || user.connectedAccounts?.linkedin?.connected}
                  size="sm"
                  variant={user.connectedAccounts?.linkedin?.connected ? "secondary" : "primary"}
                >
                  {user.connectedAccounts?.linkedin?.connected ? 'Connected' : 'Connect'}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Google</p>
                    <p className="text-sm text-gray-600">
                      {user.connectedAccounts?.google?.connected 
                        ? `Connected ${formatDate(user.connectedAccounts.google.connectedAt)}`
                        : 'Not connected'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={linkGoogle}
                  disabled={isLoading || user.connectedAccounts?.google?.connected}
                  size="sm"
                  variant={user.connectedAccounts?.google?.connected ? "secondary" : "primary"}
                >
                  {user.connectedAccounts?.google?.connected ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          {user.subscription && (
            <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">
                Subscription
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Plan
                  </label>
                  <p className="text-sm font-medium capitalize">
                    {user.subscription.plan}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscription.status === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-black'
                  }`}>
                    {user.subscription.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Expires
                  </label>
                  <p className="text-sm font-medium">
                    {formatDate(user.subscription.endDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Posts Used
                  </label>
                  <p className="text-sm font-medium">
                    {user.subscription.postsUsed} / {user.subscription.postsLimit}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
