'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Clock,
  Calendar,
  Settings,
  Users,
  BarChart3,
  FileDown,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTrackingMode } from './layout';
import { HabitTrackerMode } from '@/components/HabitTrackerMode';

export default function DashboardPage() {
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const { trackingMode, setTrackingMode } = useTrackingMode();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStart, setSessionStart] = useState<Date | null>(null);

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleTracking = () => {
    if (isTracking) {
      // Stop tracking
      setIsTracking(false);
      setSessionStart(null);
    } else {
      // Start tracking
      setIsTracking(true);
      setSessionStart(new Date());
    }
  };

  const getSessionDuration = () => {
    if (!sessionStart) return '0h 0m';
    const now = new Date();
    const diff = now.getTime() - sessionStart.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto px-4">

      {/* Current time and date header */}
      <div className="text-center mb-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-bold text-blue-600">
            <Clock className="mr-2 sm:mr-3 md:mr-4 h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20" />
            {format(currentTime, 'h:mm:ss a')}
          </div>
          <div className="flex items-center justify-center text-lg md:text-xl text-gray-600">
            <Calendar className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            {format(currentTime, 'EEEE, MMM d')}
          </div>
        </div>
      </div>

      {trackingMode === 'work' ? (
        <>
          {/* Work Time Tracking */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <div className="flex flex-col items-center">
                {/* Session timer */}
                {isTracking && (
                  <div className="text-center mb-8">
                    <div className="text-5xl md:text-6xl font-mono font-bold text-blue-600 mb-3">
                      {getSessionDuration()}
                    </div>
                    <p className="text-gray-600 text-lg">
                      Started at {sessionStart && format(sessionStart, 'h:mm a')}
                    </p>
                  </div>
                )}

                {/* Track button */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleToggleTracking}
                    className={`w-48 h-48 md:w-56 md:h-56 mx-auto rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isTracking
                        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                        : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                    }`}
                  >
                    {isTracking ? (
                      <Square className="h-20 w-20 md:h-24 md:w-24" />
                    ) : (
                      <Play className="h-20 w-20 md:h-24 md:w-24 ml-2" />
                    )}
                  </button>
                </div>

                {/* Action text */}
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                    {isTracking ? 'Clock Out' : 'Tap to Start'}
                  </p>
                  {!isTracking && (
                    <p className="text-gray-600 text-lg">
                      Ready to begin your workday
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Today's Summary</h3>
              <div className="space-y-4">
                <div className="text-center p-6 bg-blue-50 rounded-2xl">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">0h 0m</div>
                  <div className="text-lg text-gray-600">Total Time</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">0</div>
                    <div className="text-sm text-gray-600">Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-2xl">
                    <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">0h 0m</div>
                    <div className="text-sm text-gray-600">Overtime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard/groups')}
                  className="flex items-center justify-center px-8 py-6 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-2xl text-blue-700 font-medium transition-colors"
                >
                  <Users className="h-6 w-6 mr-3" />
                  My Groups
                </button>
                <button
                  onClick={() => router.push('/dashboard/history')}
                  className="flex items-center justify-center px-8 py-6 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border border-purple-200 rounded-2xl text-purple-700 font-medium transition-colors"
                >
                  <BarChart3 className="h-6 w-6 mr-3" />
                  View History
                </button>
                <button
                  onClick={() => router.push('/dashboard/export')}
                  className="flex items-center justify-center px-8 py-6 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 rounded-2xl text-green-700 font-medium transition-colors"
                >
                  <FileDown className="h-6 w-6 mr-3" />
                  Export Report
                </button>
                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="flex items-center justify-center px-8 py-6 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-2xl text-gray-700 font-medium transition-colors"
                >
                  <Settings className="h-6 w-6 mr-3" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Habit Tracking */
        <HabitTrackerMode />
      )}

      {/* Mobile Bottom Navigation - Only show on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/history')}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
            >
              <BarChart3 className="h-5 w-5 text-gray-600 transition-transform duration-200" />
              <span className="text-xs text-gray-600 mt-1">History</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/groups')}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
            >
              <Users className="h-5 w-5 text-gray-600 transition-transform duration-200" />
              <span className="text-xs text-gray-600 mt-1">Groups</span>
            </button>

            {/* Quick Mode Switch - Center */}
            {!isTracking && (
              <button
                onClick={() => setTrackingMode(trackingMode === 'work' ? 'habits' : 'work')}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all transform active:scale-95 ${
                  trackingMode === 'work'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {trackingMode === 'work' ? (
                  <Target className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </button>
            )}

            {isTracking && (
              <div className="flex flex-col items-center py-2 px-3">
                <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-green-600 mt-1 font-medium">Active</span>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard/export')}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
            >
              <FileDown className="h-5 w-5 text-gray-600 transition-transform duration-200" />
              <span className="text-xs text-gray-600 mt-1">Export</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}