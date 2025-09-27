// T024: QR Code generation component in src/components/groups/QRCodeGenerator.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState } from 'react';
import { QrCode, Download, RefreshCw, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
  groupId: string;
  groupName: string;
  onError?: (error: string) => void;
}

interface QRCodeData {
  id: string;
  qr_code_data: string;
  invitation_url: string;
  expires_at: string;
}

export default function QRCodeGenerator({ groupId, groupName, onError }: QRCodeGeneratorProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/invitations/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in_hours: expirationHours,
          error_correction_level: 'M'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      setQrData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInvitationUrl = async () => {
    if (!qrData?.invitation_url) return;

    try {
      await navigator.clipboard.writeText(qrData.invitation_url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      onError?.('Failed to copy URL to clipboard');
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qr_code_data) return;

    const link = document.createElement('a');
    link.href = qrData.qr_code_data;
    link.download = `${groupName}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">QR Code Invitation</h3>
      </div>

      {!qrData ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Time
            </label>
            <select
              id="expiration"
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
            onClick={generateQRCode}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Generate QR Code
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img
                src={qrData.qr_code_data}
                alt="QR Code for group invitation"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Scan this QR code to join "{groupName}"
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invitation URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrData.invitation_url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={copyInvitationUrl}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At
              </label>
              <p className="text-sm text-gray-600">
                {formatExpiration(qrData.expires_at)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadQRCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
            <button
              onClick={() => setQrData(null)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}