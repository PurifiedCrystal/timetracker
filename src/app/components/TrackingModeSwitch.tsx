'use client';

import React, { useState } from 'react';
import { Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface TrackingModeSwitchProps {
  currentMode: 'work' | 'habits';
  onModeChange: (mode: 'work' | 'habits') => void;
  disabled?: boolean;
  className?: string;
}

export default function TrackingModeSwitch({
  currentMode,
  onModeChange,
  disabled = false,
  className = ''
}: TrackingModeSwitchProps) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleModeSwitch = async (newMode: 'work' | 'habits') => {
    if (newMode === currentMode || switching || disabled) return;

    setSwitching(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_mode: newMode
        }),
      });

      if (response.ok) {
        onModeChange(newMode);
        setSuccess(`Switched to ${newMode === 'work' ? 'work tracking' : 'habit tracking'} mode`);

        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(null), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to switch mode');
      }
    } catch (err) {
      setError('Network error while switching mode');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Switch Toggle */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking Mode</h3>
          <p className="text-sm text-gray-600">
            Switch between work time tracking and personal habit tracking
          </p>
        </div>

        <div className="relative bg-gray-100 rounded-xl p-1 flex">
          {/* Work Mode Button */}
          <button
            onClick={() => handleModeSwitch('work')}
            disabled={switching || disabled}
            className={`
              flex-1 flex items-center justify-center px-6 py-4 rounded-lg font-medium transition-all duration-300 relative
              ${currentMode === 'work'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
              ${switching || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Clock className="h-5 w-5 mr-2" />
            <span>Work Time</span>
            {switching && currentMode === 'habits' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </button>

          {/* Habits Mode Button */}
          <button
            onClick={() => handleModeSwitch('habits')}
            disabled={switching || disabled}
            className={`
              flex-1 flex items-center justify-center px-6 py-4 rounded-lg font-medium transition-all duration-300 relative
              ${currentMode === 'habits'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
              ${switching || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Target className="h-5 w-5 mr-2" />
            <span>Habits</span>
            {switching && currentMode === 'work' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </button>
        </div>

        {/* Current Mode Description */}
        <div className="mt-6 p-4 rounded-xl bg-gray-50">
          <div className="flex items-start">
            {currentMode === 'work' ? (
              <Clock className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <Target className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                {currentMode === 'work' ? 'Work Time Tracking' : 'Personal Habit Tracking'}
              </h4>
              <p className="text-sm text-gray-600">
                {currentMode === 'work'
                  ? 'Track your work hours, breaks, and overtime. Perfect for freelancers and employees who need to log billable time.'
                  : 'Track your personal habits like exercise, meditation, reading, and more. Build streaks and improve your daily routine.'
                }
              </p>
            </div>
          </div>
        </div>
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
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Current Mode */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {currentMode === 'work' ? 'Work Tracking Actions' : 'Habit Tracking Actions'}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {currentMode === 'work' ? (
            <>
              <button className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 font-medium transition-colors">
                <Clock className="h-4 w-4 mr-2" />
                Clock In/Out
              </button>
              <button className="flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                <Target className="h-4 w-4 mr-2" />
                View Groups
              </button>
            </>
          ) : (
            <>
              <button className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-green-700 font-medium transition-colors">
                <CheckCircle className="h-4 w-4 mr-2" />
                Log Habit
              </button>
              <button className="flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                <Target className="h-4 w-4 mr-2" />
                View Stats
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}