'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Heart, Sparkles, Coffee, CheckCircle } from 'lucide-react';

interface MascotProps {
  isTracking?: boolean;
  mode?: 'work' | 'habits';
  sessionDuration?: number;
  onInteraction?: () => void;
  isVisible?: boolean;
}

type MascotState = 'idle' | 'working' | 'celebrating' | 'encouraging' | 'sleepy';

export function Mascot({
  isTracking = false,
  mode = 'work',
  sessionDuration = 0,
  onInteraction,
  isVisible = true
}: MascotProps) {
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine mascot state based on activity
  useEffect(() => {
    if (isTracking) {
      setMascotState('working');
    } else if (sessionDuration > 0) {
      setMascotState('celebrating');
      showEncouragement();
    } else if (sessionDuration === 0 && !isTracking) {
      setMascotState('idle');
    }
  }, [isTracking, sessionDuration]);

  const showEncouragement = () => {
    const encouragements = [
      "Great job! 🎉",
      "You're doing amazing! ⭐",
      "Keep up the great work! 💪",
      "Productivity champion! 🏆",
      "Time well tracked! ⏰",
      "You're on fire! 🔥"
    ];

    setMessage(encouragements[Math.floor(Math.random() * encouragements.length)]);
    setShowMessage(true);
    setIsAnimating(true);

    setTimeout(() => {
      setShowMessage(false);
      setIsAnimating(false);
    }, 3000);
  };

  const handleMascotClick = () => {
    if (onInteraction) {
      onInteraction();
    }

    const clickMessages = [
      "Hi there! 👋",
      "Ready to be productive? 🚀",
      "Let's track some time! ⏱️",
      "You've got this! 💪",
      "Time to focus! 🎯"
    ];

    setMessage(clickMessages[Math.floor(Math.random() * clickMessages.length)]);
    setShowMessage(true);
    setIsAnimating(true);

    setTimeout(() => {
      setShowMessage(false);
      setIsAnimating(false);
    }, 2000);
  };

  const getMascotEmoji = () => {
    switch (mascotState) {
      case 'working':
        return mode === 'work' ? '🔥' : '🌟';
      case 'celebrating':
        return '🎉';
      case 'encouraging':
        return '💪';
      case 'sleepy':
        return '😴';
      default:
        return '😊';
    }
  };

  const getMascotColor = () => {
    switch (mascotState) {
      case 'working':
        return mode === 'work' ? 'text-blue-600' : 'text-green-600';
      case 'celebrating':
        return 'text-yellow-500';
      case 'encouraging':
        return 'text-purple-600';
      default:
        return 'text-blue-500';
    }
  };

  const getBackgroundColor = () => {
    switch (mascotState) {
      case 'working':
        return mode === 'work' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
      case 'celebrating':
        return 'bg-yellow-50 border-yellow-200';
      case 'encouraging':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative">
      {/* Speech bubble */}
      {showMessage && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white rounded-lg shadow-lg border text-sm font-medium text-gray-800 whitespace-nowrap z-10 transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          {message}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}

      {/* Mascot */}
      <div
        onClick={handleMascotClick}
        className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${getBackgroundColor()} ${
          isAnimating ? 'animate-bounce' : ''
        } ${isTracking ? 'animate-pulse' : ''}`}
      >
        <span className={`text-2xl ${getMascotColor()} transition-all duration-300`}>
          {getMascotEmoji()}
        </span>

        {/* Activity indicator */}
        {isTracking && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Clock className="w-2 h-2 text-white" />
          </div>
        )}

        {/* Sparkles effect when celebrating */}
        {mascotState === 'celebrating' && (
          <>
            <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400 animate-ping" />
            <Sparkles className="absolute -bottom-2 -right-2 w-4 h-4 text-yellow-400 animate-ping delay-75" />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="text-center mt-2">
        <span className={`text-xs font-medium ${getMascotColor()}`}>
          {mascotState === 'working' && (mode === 'work' ? 'Working' : 'Tracking')}
          {mascotState === 'celebrating' && 'Great job!'}
          {mascotState === 'idle' && 'Ready'}
          {mascotState === 'encouraging' && 'You got this!'}
        </span>
      </div>
    </div>
  );
}