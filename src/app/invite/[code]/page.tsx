// T028: Invitation acceptance page in src/app/invite/[code]/page.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface InvitationPageProps {
  params: { code: string };
}

interface InvitationData {
  group_name: string;
  group_id: string;
  invitation_valid: boolean;
  expires_at: string;
  already_member: boolean;
  requires_auth: boolean;
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const router = useRouter();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    loadInvitationData();
  }, [params.code]);

  const loadInvitationData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/invite/${params.code}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load invitation');
      }
      const data = await response.json();
      setInvitationData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load invitation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!invitationData) return;

    if (invitationData.requires_auth) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/login?returnTo=${returnUrl}`);
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`/api/v1/invite/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join group');
      }

      const result = await response.json();
      setJoinSuccess(true);

      // Redirect to group dashboard after success
      setTimeout(() => {
        router.push(result.redirect_url || `/dashboard/groups/${invitationData.group_id}`);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) {
      return 'Expires soon';
    } else if (diffHours < 24) {
      return `Expires in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Invitation</h2>
          <p className="text-gray-600">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-4">
            {error || 'This invitation link is not valid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team!</h2>
          <p className="text-gray-600 mb-4">
            You have successfully joined "{invitationData.group_name}".
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your group dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Team</h1>
          <p className="text-gray-600">
            You've been invited to join "{invitationData.group_name}"
          </p>
        </div>

        {/* Status indicators */}
        <div className="space-y-3 mb-6">
          {invitationData.already_member && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  You are already a member of this group
                </span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Invitation Status</span>
              </div>
              <span className="text-gray-900">
                {formatExpiration(invitationData.expires_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {invitationData.already_member ? (
            <button
              onClick={() => router.push(`/dashboard/groups/${invitationData.group_id}`)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Group Dashboard
            </button>
          ) : (
            <button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Joining Group...
                </div>
              ) : invitationData.requires_auth ? (
                'Login to Join Group'
              ) : (
                'Join Group'
              )}
            </button>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>

        {/* Additional info */}
        {invitationData.requires_auth && !invitationData.already_member && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              You need to login or create an account to join this group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}