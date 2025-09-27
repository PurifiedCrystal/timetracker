// T026: Share button component with Web Share API in src/components/groups/ShareButton.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Mail } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  groupName: string;
  className?: string;
  onError?: (error: string) => void;
}

export default function ShareButton({ url, groupName, className = '', onError }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareText = `Join my team "${groupName}" - ${url}`;

  const handleWebShare = async () => {
    if (!navigator.share) {
      // Fallback to clipboard
      await handleCopyToClipboard();
      return;
    }

    setIsSharing(true);
    try {
      await navigator.share({
        title: `Join ${groupName}`,
        text: `You're invited to join "${groupName}"`,
        url: url
      });

      // Track share action
      await trackShareAction('web_share', true);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.('Failed to share. Copying to clipboard instead.');
        await handleCopyToClipboard();
        await trackShareAction('web_share', false, error.message);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackShareAction('clipboard', true);
    } catch (error) {
      onError?.('Failed to copy to clipboard');
      await trackShareAction('clipboard', false, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    trackShareAction('whatsapp', true);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join ${groupName}`);
    const body = encodeURIComponent(`You're invited to join "${groupName}".\n\nClick here to join: ${url}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl);
    trackShareAction('email', true);
  };

  const trackShareAction = async (method: string, success: boolean, errorMessage?: string) => {
    try {
      // Extract invitation code from URL
      const urlParts = url.split('/');
      const invitationCode = urlParts[urlParts.length - 1];

      await fetch(`/api/v1/groups/invitations/${invitationCode}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_method: method,
          success: success,
          error_message: errorMessage,
          platform: navigator.userAgent
        }),
      });
    } catch (error) {
      // Silent fail for tracking - don't interrupt user experience
      console.warn('Failed to track share action:', error);
    }
  };

  // Check if Web Share API is available
  const hasWebShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Primary share button */}
      <button
        onClick={handleWebShare}
        disabled={isSharing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : isSharing ? (
          <>
            <Share2 className="h-4 w-4 animate-pulse" />
            Sharing...
          </>
        ) : (
          <>
            {hasWebShare ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {hasWebShare ? 'Share' : 'Copy Link'}
          </>
        )}
      </button>

      {/* Secondary share options */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyToClipboard}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Copy to clipboard"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          title="Share on WhatsApp"
        >
          <MessageCircle className="h-3 w-3" />
          WhatsApp
        </button>

        <button
          onClick={handleEmailShare}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Share via email"
        >
          <Mail className="h-3 w-3" />
          Email
        </button>
      </div>
    </div>
  );
}