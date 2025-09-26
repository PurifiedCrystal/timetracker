'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Calendar,
  BarChart3,
  Star,
  TrendingUp,
  Award,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface HabitEntry {
  id: string;
  habit_name: string;
  habit_category: string;
  entry_type: string;
  completed_at: string;
  count_value?: number;
  target_value?: number;
  notes?: string;
  mood_rating?: number;
}

interface HabitStats {
  total_habits: number;
  completed_today: number;
  current_streaks: number;
  total_time_today: number;
  categories: string[];
}

const DEFAULT_HABITS = [
  { name: 'Exercise', icon: '🏃‍♂️', category: 'fitness', type: 'duration' },
  { name: 'Meditation', icon: '🧘‍♂️', category: 'wellness', type: 'duration' },
  { name: 'Water (8oz)', icon: '💧', category: 'health', type: 'count', target: 8 },
  { name: 'Reading', icon: '📚', category: 'learning', type: 'duration' },
  { name: 'Vitamins', icon: '💊', category: 'health', type: 'completion' },
  { name: 'Journaling', icon: '📝', category: 'wellness', type: 'completion' },
  { name: 'Stretching', icon: '🤸‍♀️', category: 'fitness', type: 'duration' },
  { name: 'Gratitude', icon: '🙏', category: 'wellness', type: 'completion' },
];

const AVAILABLE_ICONS = [
  // Fitness & Health
  '🏃‍♂️', '🤸‍♀️', '🏋️‍♂️', '🚴‍♂️', '🏊‍♂️', '🧘‍♂️', '🏃‍♀️', '⚡', '💪', '🥗',
  // Learning & Work
  '📚', '📝', '💻', '📖', '🎓', '✏️', '📊', '💡', '🧠', '📓',
  // Wellness & Self-Care
  '💧', '💊', '🛌', '🌱', '🙏', '😊', '🎯', '⭐', '🌟', '✨',
  // Daily Activities
  '☕', '🍎', '🥛', '🧹', '🛁', '📱', '📺', '🎵', '🎨', '🎭',
  // Nature & Outdoor
  '🌞', '🌙', '🌿', '🌸', '🍃', '🏞️', '🌊', '🌈', '☀️', '🌻'
];

export const HabitTrackerMode = React.memo(() => {
  const [todayEntries, setTodayEntries] = useState<HabitEntry[]>([]);
  const [customHabits, setCustomHabits] = useState<any[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStats>({
    total_habits: 0,
    completed_today: 0,
    current_streaks: 0,
    total_time_today: 0,
    categories: []
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('personal');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabitData();
  }, []);

  const loadHabitData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to load from API
      try {
        const entriesResponse = await fetch(`/api/v1/habits/entries?start_date=${today}&end_date=${today}`);
        if (entriesResponse.ok) {
          const data = await entriesResponse.json();
          setTodayEntries(data.entries || []);
        }

        const statsResponse = await fetch('/api/v1/habits/stats');
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setHabitStats(data.stats || habitStats);
        }
      } catch (apiError) {
        console.warn('API failed, using localStorage fallback:', apiError);
      }

      // Load from localStorage
      const savedEntries = localStorage.getItem(`habit_entries_${today}`);
      const savedCustomHabits = localStorage.getItem('custom_habits');

      if (savedEntries) {
        setTodayEntries(JSON.parse(savedEntries));
      }

      if (savedCustomHabits) {
        setCustomHabits(JSON.parse(savedCustomHabits));
      }
    } catch (error) {
      console.error('Failed to load habit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logHabit = async (habitName: string, category: string, type: string, target?: number) => {
    try {
      const entryData = {
        id: Date.now().toString(),
        habit_name: habitName,
        habit_category: category,
        entry_type: type,
        completed_at: new Date().toISOString(),
        count_value: type === 'count' ? 1 : undefined,
        target_value: target,
        entry_date: new Date().toISOString().split('T')[0]
      };

      // Try API first
      try {
        const response = await fetch('/api/v1/habits/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });

        if (response.ok) {
          await loadHabitData();
          return;
        }
      } catch (apiError) {
        console.warn('API log failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const today = new Date().toISOString().split('T')[0];
      const existingEntries = JSON.parse(localStorage.getItem(`habit_entries_${today}`) || '[]');

      // Check if already logged today
      if (!existingEntries.some((entry: any) => entry.habit_name === habitName)) {
        existingEntries.push(entryData);
        localStorage.setItem(`habit_entries_${today}`, JSON.stringify(existingEntries));
        setTodayEntries(existingEntries);
      }
    } catch (error) {
      console.error('Failed to log habit:', error);
    }
  };

  const addCustomHabit = async () => {
    if (!newHabitName.trim()) return;

    // Create new custom habit
    const newHabit = {
      name: newHabitName,
      icon: selectedIcon,
      category: newHabitCategory,
      type: 'completion',
      id: Date.now().toString()
    };

    // Save to localStorage
    const existingCustomHabits = JSON.parse(localStorage.getItem('custom_habits') || '[]');
    const updatedCustomHabits = [...existingCustomHabits, newHabit];
    localStorage.setItem('custom_habits', JSON.stringify(updatedCustomHabits));
    setCustomHabits(updatedCustomHabits);

    // Log the habit immediately
    await logHabit(newHabitName, newHabitCategory, 'completion');

    // Reset form
    setNewHabitName('');
    setNewHabitCategory('personal');
    setSelectedIcon('🎯');
    setShowAddForm(false);
    setShowIconPicker(false);
  };

  const deleteCustomHabit = async (habitId: string, habitName: string) => {
    // Remove from custom habits list
    const updatedCustomHabits = customHabits.filter(habit => habit.id !== habitId);
    localStorage.setItem('custom_habits', JSON.stringify(updatedCustomHabits));
    setCustomHabits(updatedCustomHabits);

    // Remove all entries for this habit from today's entries
    const today = new Date().toISOString().split('T')[0];
    const updatedEntries = todayEntries.filter(entry => entry.habit_name !== habitName);
    localStorage.setItem(`habit_entries_${today}`, JSON.stringify(updatedEntries));
    setTodayEntries(updatedEntries);
  };

  const removeHabitEntry = async (habitName: string) => {
    // Remove the most recent entry for this habit from today
    const today = new Date().toISOString().split('T')[0];
    const updatedEntries = [...todayEntries];

    // Find and remove the last entry for this habit
    for (let i = updatedEntries.length - 1; i >= 0; i--) {
      if (updatedEntries[i].habit_name === habitName) {
        updatedEntries.splice(i, 1);
        break;
      }
    }

    localStorage.setItem(`habit_entries_${today}`, JSON.stringify(updatedEntries));
    setTodayEntries(updatedEntries);
  };

  const isHabitCompletedToday = (habitName: string) => {
    return todayEntries.some(entry => entry.habit_name === habitName);
  };

  const getHabitCount = (habitName: string) => {
    const entries = todayEntries.filter(entry => entry.habit_name === habitName);
    return entries.reduce((sum, entry) => sum + (entry.count_value || 1), 0);
  };

  const getAllHabits = () => {
    return [...DEFAULT_HABITS, ...customHabits];
  };

  const getCompletionRate = () => {
    const allHabits = getAllHabits();
    if (allHabits.length === 0) return 0;
    const completed = allHabits.filter(habit => isHabitCompletedToday(habit.name)).length;
    return Math.round((completed / allHabits.length) * 100);
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Habit Tracker Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Habit Tracker</h2>
          <p className="text-gray-600">
            Build positive routines and track your daily progress
          </p>
        </div>

        {/* Today's Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{getCompletionRate()}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionRate()}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-lg font-bold text-blue-600">{habitStats.completed_today}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-lg font-bold text-purple-600">{habitStats.current_streaks}</div>
            <div className="text-xs text-gray-600">Streaks</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-lg font-bold text-green-600">{getAllHabits().length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Quick Log Habits */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Log</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add Custom Habit Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-green-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Add Custom Habit</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Habit name (e.g., Walk 10k steps)"
              />

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Choose Icon</label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl p-2 bg-white rounded-lg border border-gray-300">
                    {selectedIcon}
                  </div>
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    {showIconPicker ? 'Hide Icons' : 'Pick Icon'}
                  </button>
                </div>

                {/* Icon Picker Grid */}
                {showIconPicker && (
                  <div className="bg-white border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {AVAILABLE_ICONS.map((icon, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedIcon(icon);
                            setShowIconPicker(false);
                          }}
                          className={`text-lg p-1.5 rounded hover:bg-gray-100 transition-colors ${
                            selectedIcon === icon ? 'bg-green-100 ring-1 ring-green-500' : ''
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="personal">Personal</option>
                <option value="fitness">Fitness</option>
                <option value="wellness">Wellness</option>
                <option value="health">Health</option>
                <option value="learning">Learning</option>
                <option value="work">Work</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={addCustomHabit}
                  disabled={!newHabitName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add & Log
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewHabitName('');
                    setSelectedIcon('🎯');
                    setShowIconPicker(false);
                  }}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habit Grid */}
        <div className="grid grid-cols-1 gap-3">
          {getAllHabits().map((habit, index) => {
            const isCompleted = isHabitCompletedToday(habit.name);
            const count = getHabitCount(habit.name);
            const isCustomHabit = customHabits.some(ch => ch.id === habit.id);

            return (
              <button
                key={habit.id || index}
                onClick={() => {
                  if (isCompleted) {
                    removeHabitEntry(habit.name);
                  } else {
                    logHabit(habit.name, habit.category, habit.type, habit.target);
                  }
                }}
                className={`w-full flex items-center p-3 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                  isCompleted
                    ? 'bg-green-100 border-green-300 hover:bg-green-200'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl mr-3">{habit.icon}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {habit.name}
                    </div>
                    {isCustomHabit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomHabit(habit.id, habit.name);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete habit"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isCompleted ? (
                      habit.type === 'count' && habit.target ? (
                        `${count}/${habit.target} completed`
                      ) : (
                        'Completed today!'
                      )
                    ) : (
                      'Tap to log'
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="space-y-2">
            {todayEntries.slice(-5).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{entry.habit_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{entry.habit_category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {format(new Date(entry.completed_at), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Keep Going!</h3>
            <p className="text-sm opacity-90">
              {getCompletionRate() === 100
                ? "Amazing! You've completed all your habits today!"
                : getCompletionRate() >= 50
                ? "You're doing great! Keep building those positive habits."
                : "Every habit counts. Start small and build momentum!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

HabitTrackerMode.displayName = 'HabitTrackerMode';