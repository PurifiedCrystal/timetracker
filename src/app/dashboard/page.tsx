'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Users,
  BarChart3,
  FileDown,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { useTrackingMode } from './layout';
import { HabitTrackerMode } from '@/components/HabitTrackerMode';

export default function DashboardPage() {
  const [isTracking, setIsTracking] = useState(false);
  const { trackingMode } = useTrackingMode();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Update current time every second
  React.useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

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
    if (!sessionStart) return '00:00:00';
    const now = new Date();
    const diff = now.getTime() - sessionStart.getTime();
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto px-4">

      {/* Current time and date header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="space-y-2">
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-mono font-bold text-blue-600">
            {mounted ? format(currentTime, 'h:mm:ss a') : '00:00:00 AM'}
          </div>
          <div className="text-lg md:text-xl text-gray-600 animate-slide-up">
            {mounted ? format(currentTime, 'EEEE, MMM d') : 'Loading...'}
          </div>
        </div>
      </div>

      {trackingMode === 'work' ? (
        <>
          {/* Work Time Tracking */}
          <div className="mb-8 animate-slide-up">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col items-center">
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
                <div className="text-center mb-6">
                  <p className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                    {isTracking ? 'Clock Out' : 'Clock In'}
                  </p>
                  {isTracking && (
                    <p className="text-gray-600 text-lg">
                      Started at {sessionStart && format(sessionStart, 'h:mm a')}
                    </p>
                  )}
                  {!isTracking && (
                    <p className="text-gray-600 text-lg">
                      Ready to begin your workday
                    </p>
                  )}
                </div>

                {/* Session timer */}
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-mono font-bold text-blue-600 mb-3">
                    {isTracking ? getSessionDuration() : '00:00:00'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="mb-8 animate-slide-up animation-delay-200">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
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
          <div className="mb-8 animate-slide-up animation-delay-400">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => window.location.href = '/dashboard/groups'}
                  className="flex items-center justify-center px-8 py-6 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-2xl text-blue-700 font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
                >
                  <Users className="h-6 w-6 mr-3" />
                  My Groups
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/history'}
                  className="flex items-center justify-center px-8 py-6 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border border-purple-200 rounded-2xl text-purple-700 font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
                >
                  <BarChart3 className="h-6 w-6 mr-3" />
                  View History
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/export'}
                  className="flex items-center justify-center px-8 py-6 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 rounded-2xl text-green-700 font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
                >
                  <FileDown className="h-6 w-6 mr-3" />
                  Export Report
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/settings'}
                  className="flex items-center justify-center px-8 py-6 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-2xl text-gray-700 font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
                >
                  <User className="h-6 w-6 mr-3" />
                  Profile
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Habit Tracking */
        <HabitTrackerMode />
      )}
    </div>
  );
}