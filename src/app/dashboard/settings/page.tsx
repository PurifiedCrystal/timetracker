'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Clock,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CaliforniaToggle from '@/app/components/settings/CaliforniaToggle';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  location_state: string | null;
  timezone: string | null;
  export_preferences: {
    default_format: string;
    include_breaks: boolean;
    include_overtime: boolean;
  } | null;
  california_mode: boolean;
  tracking_mode: 'work' | 'habits';
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [locationState, setLocationState] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultExportFormat, setDefaultExportFormat] = useState('excel');
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeOvertime, setIncludeOvertime] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/v1/profile');
      if (response.ok) {
        const data = await response.json();
        const userProfile = data.profile;
        setProfile(userProfile);

        // Populate form fields
        setFullName(userProfile.full_name || '');
        setLocationState(userProfile.location_state || '');
        setTimezone(userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

        if (userProfile.export_preferences) {
          setDefaultExportFormat(userProfile.export_preferences.default_format || 'excel');
          setIncludeBreaks(userProfile.export_preferences.include_breaks ?? true);
          setIncludeOvertime(userProfile.export_preferences.include_overtime ?? true);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        full_name: fullName.trim(),
        location_state: locationState.trim().toUpperCase() || null,
        timezone: timezone,
        export_preferences: {
          default_format: defaultExportFormat,
          include_breaks: includeBreaks,
          include_overtime: includeOvertime
        }
      };

      const response = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSuccess('Settings saved successfully');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Mobile-first header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">
          Manage your profile and preferences
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          </div>

          <div className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Location State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (State)
              </label>
              <select
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your state...</option>
                {stateOptions.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Required for labor law compliance (California overtime rules)
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Anchorage">Alaska Time</option>
                <option value="Pacific/Honolulu">Hawaii Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Export Preferences */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Download className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Export Preferences</h2>
          </div>

          <div className="space-y-6">
            {/* Default Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Export Format
              </label>
              <select
                value={defaultExportFormat}
                onChange={(e) => setDefaultExportFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="csv">CSV (Comma-separated values)</option>
                <option value="pdf">PDF (Portable Document Format)</option>
                <option value="excel">Excel (Microsoft Excel)</option>
              </select>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Include in Exports</h3>

              <div className="flex items-center">
                <input
                  id="include-breaks"
                  type="checkbox"
                  checked={includeBreaks}
                  onChange={(e) => setIncludeBreaks(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include-breaks" className="ml-3 text-sm text-gray-700">
                  Include break time details
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="include-overtime"
                  type="checkbox"
                  checked={includeOvertime}
                  onChange={(e) => setIncludeOvertime(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include-overtime" className="ml-3 text-sm text-gray-700">
                  Include overtime calculations
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* California Labor Laws Toggle */}
      <div className="mb-8">
        <CaliforniaToggle
          enabled={profile?.california_mode || false}
          onToggle={(enabled) => {
            if (profile) {
              setProfile({ ...profile, california_mode: enabled });
            }
          }}
          disabled={saving}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
          ) : (
            <Save className="h-5 w-5 mr-3" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Account Info */}
      {profile && (
        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Account created:</span>
              <span className="ml-2 text-gray-900">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Account ID:</span>
              <span className="ml-2 text-gray-900 font-mono text-xs">
                {profile.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}