'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileDown,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  overtime_minutes: number;
}

interface ActiveSession {
  entry: TimeEntry | null;
  is_clocked_in: boolean;
  current_duration: number;
}

export default function DashboardPage() {
  const [activeSession, setActiveSession] = useState<ActiveSession>({
    entry: null,
    is_clocked_in: false,
    current_duration: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load active session
  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    try {
      const response = await fetch('/api/v1/time/active');
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load session');
      }
    } catch (err) {
      setError('Network error loading session');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/time/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            location: 'Dashboard',
            device: navigator.userAgent
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession({
          entry: data.entry,
          is_clocked_in: true,
          current_duration: 0
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to clock in');
      }
    } catch (err) {
      setError('Network error during clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeSession.entry) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/time/entries/${activeSession.entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clock_out: new Date().toISOString(),
          break_minutes: 0
        }),
      });

      if (response.ok) {
        setActiveSession({
          entry: null,
          is_clocked_in: false,
          current_duration: 0
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to clock out');
      }
    } catch (err) {
      setError('Network error during clock out');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentSessionDuration = (): number => {
    if (!activeSession.entry || !activeSession.is_clocked_in) return 0;

    const clockInTime = new Date(activeSession.entry.clock_in);
    const now = new Date();
    return Math.floor((now.getTime() - clockInTime.getTime()) / 1000 / 60);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentSessionMinutes = getCurrentSessionDuration();

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Clock className="flex-shrink-0 mr-1.5 h-5 w-5" />
              {format(currentTime, 'h:mm:ss a')}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-gray-100 mb-4">
                {activeSession.is_clocked_in ? (
                  <Square className="h-16 w-16 text-red-600" />
                ) : (
                  <Play className="h-16 w-16 text-green-600" />
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeSession.is_clocked_in ? 'Currently Clocked In' : 'Ready to Start'}
              </h3>

              {activeSession.is_clocked_in && activeSession.entry && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Started at {format(new Date(activeSession.entry.clock_in), 'h:mm a')}
                  </p>
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {formatDuration(currentSessionMinutes)}
                  </div>
                </div>
              )}

              <div className="mt-6">
                {activeSession.is_clocked_in ? (
                  <button
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Clock Out
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={actionLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Clock In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0h 0m</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">0h 0m</div>
                <div className="text-sm text-gray-600">Overtime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <BarChart3 className="h-4 w-4 mr-2" />
                View History
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FileDown className="h-4 w-4 mr-2" />
                Export Report
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}