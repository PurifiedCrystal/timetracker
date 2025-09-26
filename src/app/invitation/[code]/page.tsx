'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const invitationCode = params.code as string;

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadInvitationInfo();
  }, [invitationCode]);

  const loadInvitationInfo = async () => {
    try {
      const response = await fetch(`/api/v1/invitations/${invitationCode}/info`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load invitation');
      }

      setInvitation(data.invitation_info);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/invitations/${invitationCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/groups');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleDecline = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg font-medium text-gray-900">Loading invitation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
            <p className="text-gray-600 mb-6">
              You've successfully joined <strong>{invitation?.groups?.name}</strong>.
              Redirecting to your groups...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-xl font-bold">Group Invitation</h1>
              <p className="text-blue-100">You've been invited to join a team</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {invitation?.groups?.name}
            </h2>
            {invitation?.groups?.description && (
              <p className="text-gray-600 mb-4">
                {invitation?.groups?.description}
              </p>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Users className="h-4 w-4 mr-2" />
                <span>Invited by: {invitation?.invited_by_profile?.full_name || invitation?.invited_by_profile?.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  Expires: {new Date(invitation?.expires_at).toLocaleDateString()} at {new Date(invitation?.expires_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Group'
              )}
            </button>

            <button
              onClick={handleDecline}
              disabled={joining}
              className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By joining this group, you'll be able to track time together and share reports with team members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}