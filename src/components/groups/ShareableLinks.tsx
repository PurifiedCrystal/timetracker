// T025: Shareable link component in src/components/groups/ShareableLinks.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState } from 'react';
import { Link, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import ShareButton from './ShareButton';

interface ShareableLinksProps {
  groupId: string;
  groupName: string;
  onError?: (error: string) => void;
}

interface ShareableLink {
  id: string;
  shareable_url: string;
  token: string;
  expires_at: string;
}

export default function ShareableLinks({ groupId, groupName, onError }: ShareableLinksProps) {
  const [linkData, setLinkData] = useState<ShareableLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);

  const createShareableLink = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/invitations/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in_hours: expirationHours,
          max_uses: 100
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shareable link');
      }

      const data = await response.json();
      setLinkData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shareable link';
      onError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareableUrl = async () => {
    if (!linkData?.shareable_url) return;

    try {
      await navigator.clipboard.writeText(linkData.shareable_url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      onError?.('Failed to copy URL to clipboard');
    }
  };

  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Shareable Link</h3>
      </div>

      {!linkData ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="link-expiration" className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Time
            </label>
            <select
              id="link-expiration"
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          <button
            onClick={createShareableLink}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating Link...
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                Create Shareable Link
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shareable URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkData.shareable_url}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={copyShareableUrl}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Copy URL"
              >
                {urlCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Expires: {formatExpiration(linkData.expires_at)}</span>
          </div>

          <div className="flex gap-2">
            <ShareButton
              url={linkData.shareable_url}
              groupName={groupName}
              className="flex-1"
              onError={onError}
            />
            <button
              onClick={() => setLinkData(null)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Create New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}