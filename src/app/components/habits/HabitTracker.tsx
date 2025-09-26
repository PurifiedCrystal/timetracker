'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  Hash,
  Play,
  Square,
  AlertCircle,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import type { HabitEntry, CreateHabitEntryRequest } from '@/types/habit';

interface HabitTrackerProps {
  onHabitLogged?: (habit: HabitEntry) => void;
  className?: string;
}

export default function HabitTracker({
  onHabitLogged,
  className = ''
}: HabitTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('personal');
  const [entryType, setEntryType] = useState<'completion' | 'timed' | 'counter'>('completion');
  const [countValue, setCountValue] = useState(1);
  const [targetValue, setTargetValue] = useState('');
  const [notes, setNotes] = useState('');
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer effect for timed habits
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timerStart) {
      interval = setInterval(() => {
        setTimerDuration(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerStart]);

  const resetForm = () => {
    setHabitName('');
    setHabitCategory('personal');
    setEntryType('completion');
    setCountValue(1);
    setTargetValue('');
    setNotes('');
    setMoodRating(null);
    setIsTimerActive(false);
    setTimerStart(null);
    setTimerDuration(0);
    setError(null);
  };

  const startTimer = () => {
    setTimerStart(new Date());
    setIsTimerActive(true);
    setTimerDuration(0);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!habitName.trim()) {
      setError('Habit name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const habitData: CreateHabitEntryRequest = {
        habit_name: habitName.trim(),
        habit_category: habitCategory,
        entry_type: entryType,
        notes: notes.trim() || undefined,
        mood_rating: moodRating || undefined
      };

      // Add type-specific data
      if (entryType === 'completion') {
        habitData.completed_at = new Date().toISOString();
      } else if (entryType === 'timed' && timerStart) {
        habitData.start_time = timerStart.toISOString();
        habitData.end_time = new Date().toISOString();
      } else if (entryType === 'counter') {
        habitData.count_value = countValue;
        if (targetValue.trim()) {
          habitData.target_value = parseInt(targetValue);
        }
      }

      const response = await fetch('/api/v1/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(habitData),
      });

      if (response.ok) {
        const data = await response.json();
        onHabitLogged?.(data.habit_entry);
        resetForm();
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to log habit');
      }
    } catch (err) {
      setError('Network error while logging habit');
    } finally {
      setLoading(false);
    }
  };

  const quickHabits = [
    { name: 'Exercise', category: 'health', type: 'timed' as const },
    { name: 'Meditation', category: 'wellness', type: 'timed' as const },
    { name: 'Water (8oz)', category: 'health', type: 'counter' as const },
    { name: 'Reading', category: 'learning', type: 'timed' as const },
    { name: 'Vitamins', category: 'health', type: 'completion' as const },
    { name: 'Journaling', category: 'wellness', type: 'completion' as const }
  ];

  const handleQuickHabit = (habit: typeof quickHabits[0]) => {
    setHabitName(habit.name);
    setHabitCategory(habit.category);
    setEntryType(habit.type);
    setShowAddForm(true);
    if (habit.type === 'timed') {
      startTimer();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Habit Tracker</h2>
        <p className="text-gray-600">
          Track your daily habits and build positive routines
        </p>
      </div>

      {/* Quick Habits */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Log</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickHabits.map((habit, index) => (
            <button
              key={index}
              onClick={() => handleQuickHabit(habit)}
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors text-left"
            >
              {habit.type === 'completion' && <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />}
              {habit.type === 'timed' && <Clock className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />}
              {habit.type === 'counter' && <Hash className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" />}
              <div>
                <div className="font-medium text-gray-900 text-sm">{habit.name}</div>
                <div className="text-xs text-gray-500 capitalize">{habit.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Habit Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-xl transition-all transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6 mr-3" />
          Add Custom Habit
        </button>
      )}

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Log Habit</h3>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habit Name
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="e.g., Morning Run, Read 20 pages"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="wellness">Wellness</option>
                  <option value="learning">Learning</option>
                  <option value="productivity">Productivity</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as 'completion' | 'timed' | 'counter')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="completion">Simple Check-off</option>
                  <option value="timed">Timed Activity</option>
                  <option value="counter">Count/Quantity</option>
                </select>
              </div>
            </div>

            {/* Timer for Timed Habits */}
            {entryType === 'timed' && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-blue-600 mb-4">
                    {formatTime(timerDuration)}
                  </div>
                  <button
                    type="button"
                    onClick={isTimerActive ? stopTimer : startTimer}
                    className={`
                      flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-colors
                      ${isTimerActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                    `}
                  >
                    {isTimerActive ? (
                      <>
                        <Square className="h-5 w-5 mr-2" />
                        Stop Timer
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start Timer
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Counter for Counter Habits */}
            {entryType === 'counter' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    value={countValue}
                    onChange={(e) => setCountValue(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target (optional)
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g., 8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}

            {/* Mood Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How did it feel? (optional)
              </label>
              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMoodRating(moodRating === rating ? null : rating)}
                    className={`
                      p-2 rounded-full transition-colors
                      ${moodRating === rating
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }
                    `}
                  >
                    {rating <= 2 && <Frown className="h-6 w-6" />}
                    {rating === 3 && <Meh className="h-6 w-6" />}
                    {rating >= 4 && <Smile className="h-6 w-6" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional thoughts or details..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (entryType === 'timed' && isTimerActive)}
              className="w-full flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <CheckCircle className="h-6 w-6 mr-3" />
              )}
              {loading ? 'Logging...' : 'Log Habit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}