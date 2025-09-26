'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  ArrowLeft,
  Target,
  Briefcase,
  Filter,
  ChevronDown,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subYears } from 'date-fns';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  metadata: any;
  group_id?: string;
}

interface HabitEntry {
  id: string;
  habit_name: string;
  habit_category: string;
  entry_type: string;
  completed_at: string;
  count_value?: number;
  target_value?: number;
  notes?: string;
}

type HistoryMode = 'work' | 'habits';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function HistoryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<HistoryMode>('work');
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadHistoryData();
  }, [mode, dateRange]);

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 0 });
        endDate = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'all':
        startDate = subYears(now, 10); // Go back 10 years for "all time"
        endDate = now;
        break;
      default:
        startDate = subDays(now, 7);
        endDate = now;
    }

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const { start_date, end_date } = getDateRangeParams();

      if (mode === 'work') {
        const response = await fetch(`/api/v1/time-entries?start_date=${start_date}&end_date=${end_date}`);
        if (response.ok) {
          const data = await response.json();
          setTimeEntries(data.entries || []);
        }
      } else {
        const response = await fetch(`/api/v1/habits/entries?start_date=${start_date.split('T')[0]}&end_date=${end_date.split('T')[0]}`);
        if (response.ok) {
          const data = await response.json();
          setHabitEntries(data.entries || []);
        }
      }
    } catch (error) {
      console.error('Failed to load history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getWorkSummary = () => {
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const sessions = timeEntries.length;
    const avgSessionMinutes = sessions > 0 ? Math.round(totalMinutes / sessions) : 0;
    return { totalMinutes, sessions, avgSessionMinutes };
  };

  const getHabitSummary = () => {
    const totalHabits = new Set(habitEntries.map(entry => entry.habit_name)).size;
    const totalEntries = habitEntries.length;
    const categories = new Set(habitEntries.map(entry => entry.habit_category)).size;
    return { totalHabits, totalEntries, categories };
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <div className="pb-20 max-w-md mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-md mx-auto lg:max-w-4xl lg:px-8">
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

      {/* Header with Mode Toggle */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">History & Reports</h1>

        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-2">
          <div className="flex items-center justify-center space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('work')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'work'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Work Time
            </button>
            <button
              onClick={() => setMode('habits')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'habits'
                  ? 'bg-white shadow-sm text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Habits
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">{getDateRangeLabel()}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-2 bg-white rounded-2xl shadow-lg p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['today', 'week', 'month', 'quarter', 'year', 'all'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setShowFilters(false);
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range === 'today' ? 'Today' :
                   range === 'week' ? 'This Week' :
                   range === 'month' ? 'This Month' :
                   range === 'quarter' ? 'This Quarter' :
                   range === 'year' ? 'This Year' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        {mode === 'work' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Work Time Summary</h2>
            </div>

            {(() => {
              const summary = getWorkSummary();
              return (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <div className="text-lg font-bold text-blue-600">{formatMinutesToHours(summary.totalMinutes)}</div>
                    <div className="text-xs text-gray-600">Total Time</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-lg font-bold text-green-600">{summary.sessions}</div>
                    <div className="text-xs text-gray-600">Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-lg font-bold text-purple-600">{formatMinutesToHours(summary.avgSessionMinutes)}</div>
                    <div className="text-xs text-gray-600">Avg Session</div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Habits Summary</h2>
            </div>

            {(() => {
              const summary = getHabitSummary();
              return (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-lg font-bold text-green-600">{summary.totalHabits}</div>
                    <div className="text-xs text-gray-600">Habits</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <div className="text-lg font-bold text-blue-600">{summary.totalEntries}</div>
                    <div className="text-xs text-gray-600">Completions</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-lg font-bold text-purple-600">{summary.categories}</div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Entry Details */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {mode === 'work' ? 'Time Entries' : 'Habit Entries'}
        </h3>

        {mode === 'work' ? (
          timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No time entries for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {format(new Date(entry.clock_in), 'MMM d, h:mm a')} - {' '}
                        {entry.clock_out ? format(new Date(entry.clock_out), 'h:mm a') : 'Active'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.metadata?.mode === 'habits' ? 'Habit Tracking' : 'Work Time'}
                        {entry.group_id && ' • Group Assignment'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600 text-sm">
                      {formatMinutesToHours(entry.duration_minutes || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          habitEntries.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No habit entries for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habitEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{entry.habit_name}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {entry.habit_category} • {format(new Date(entry.completed_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.count_value && entry.target_value && (
                      <div className="text-xs text-green-600 font-medium">
                        {entry.count_value}/{entry.target_value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}