'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface CaliforniaToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function CaliforniaToggle({
  enabled,
  onToggle,
  disabled = false,
  className = ''
}: CaliforniaToggleProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggle = async () => {
    if (saving || disabled) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          california_mode: !enabled
        }),
      });

      if (response.ok) {
        onToggle(!enabled);
        setSuccess(
          !enabled
            ? 'California overtime rules enabled'
            : 'Standard overtime rules enabled'
        );

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update California mode');
      }
    } catch (err) {
      setError('Network error while updating California mode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* California Toggle Setting */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mr-2">
                California Labor Laws
              </h3>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enable California-specific overtime calculations (8 hours daily + 40 hours weekly)
            </p>

            {/* Toggle Switch */}
            <div className="flex items-center">
              <button
                onClick={handleToggle}
                disabled={saving || disabled}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  ${saving || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                >
                  {saving && (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-blue-600"></div>
                    </div>
                  )}
                </span>
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {enabled ? 'California Mode ON' : 'Standard Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className={`mt-6 p-4 rounded-xl ${enabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-start">
            <div className={`p-1 rounded-full ${enabled ? 'bg-blue-100' : 'bg-gray-100'} mr-3`}>
              <Info className={`h-4 w-4 ${enabled ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {enabled ? 'California Overtime Rules' : 'Standard Overtime Rules'}
              </h4>
              <div className="text-sm text-gray-600">
                {enabled ? (
                  <ul className="space-y-1">
                    <li>• Overtime after 8 hours in a single day</li>
                    <li>• Overtime after 40 hours in a work week</li>
                    <li>• Double time after 12 hours in a single day</li>
                    <li>• Double time after 8 hours on 7th consecutive day</li>
                  </ul>
                ) : (
                  <ul className="space-y-1">
                    <li>• Overtime after 40 hours in a work week</li>
                    <li>• Standard federal overtime rules apply</li>
                    <li>• No daily overtime calculations</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning for California Users */}
        {!enabled && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">
                  California Workers
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  If you work in California, you should enable this toggle to ensure accurate overtime calculations according to state labor laws.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Updated</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">About Overtime Calculations</h4>
        <p className="text-sm text-gray-600">
          This setting affects how overtime is calculated in your time reports and earnings.
          You can change this setting at any time, and it will apply to future time entries.
          Past entries will maintain their original calculations.
        </p>
      </div>
    </div>
  );
}