'use client';

import React, { useState } from 'react';
import { QrCode, Share2, Copy, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react';
import type { QRCodeResponse } from '@/types/invitation';

interface QRCodeInviteProps {
  groupId: string;
  groupName: string;
  onInvitationGenerated?: (invitation: QRCodeResponse) => void;
  className?: string;
}

export default function QRCodeInvite({
  groupId,
  groupName,
  onInvitationGenerated,
  className = ''
}: QRCodeInviteProps) {
  const [generating, setGenerating] = useState(false);
  const [invitation, setInvitation] = useState<QRCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);

  const generateQRInvitation = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/invitations/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          expires_in_hours: expiryHours
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newInvitation = data.invitation;
        setInvitation(newInvitation);
        onInvitationGenerated?.(newInvitation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate invitation');
      }
    } catch (err) {
      setError('Network error while generating invitation');
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteLink = async () => {
    if (!invitation) return;

    const inviteLink = `${window.location.origin}/join/${invitation.invitation_code}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link to clipboard');
    }
  };

  const shareInvitation = async () => {
    if (!invitation) return;

    const inviteLink = `${window.location.origin}/join/${invitation.invitation_code}`;
    const shareData = {
      title: `Join ${groupName}`,
      text: `You've been invited to join the ${groupName} group for time tracking.`,
      url: inviteLink
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copyInviteLink();
      }
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', err);
    }
  };

  const formatExpiryTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Generate Invitation Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Invite to {groupName}
          </h3>
          <p className="text-gray-600">
            Generate a QR code invitation that others can scan to join your group
          </p>
        </div>

        {!invitation ? (
          <>
            {/* Expiry Setting */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Invitation expires after
              </label>
              <div className="flex items-center space-x-3">
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                  disabled={generating}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>2 days</option>
                  <option value={168}>1 week</option>
                </select>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQRInvitation}
              disabled={generating}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <QrCode className="h-6 w-6 mr-3" />
              )}
              {generating ? 'Generating...' : 'Generate QR Invitation'}
            </button>
          </>
        ) : (
          /* Display Generated Invitation */
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="text-center">
              <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-2xl">
                {/* This would normally display the actual QR code */}
                <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">QR Code</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {invitation.invitation_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invitation Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Group:</span>
                  <span className="font-medium text-gray-900">{invitation.group_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Code:</span>
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                    {invitation.invitation_code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expires:</span>
                  <span className="text-sm text-gray-900">
                    {formatExpiryTime(invitation.expires_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={copyInviteLink}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <Copy className="h-5 w-5 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareInvitation}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-xl transition-colors"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>

            {/* Generate New Button */}
            <button
              onClick={() => {
                setInvitation(null);
                setError(null);
              }}
              className="w-full px-4 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Generate New Invitation
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-start">
          <Users className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share the QR code or link with people you want to invite</li>
              <li>• They scan the code or click the link to see group details</li>
              <li>• They can join instantly with a single tap</li>
              <li>• You'll see them appear in your group members list</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {copied && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Copied</h3>
              <div className="mt-2 text-sm text-green-700">
                Invitation link copied to clipboard
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}