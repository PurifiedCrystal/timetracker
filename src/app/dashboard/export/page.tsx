'use client';

import React, { useState } from 'react';
import {
  FileDown,
  FileText,
  File,
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Download,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type ExportType = 'work' | 'habits' | 'combined';
type ExportFormat = 'csv' | 'json';
type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function ExportPage() {
  const router = useRouter();
  const [exportType, setExportType] = useState<ExportType>('work');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
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
        default:
          startDate = subDays(now, 7);
          endDate = now;
      }
    }

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const { start_date, end_date } = getDateRangeParams();
      let data: any[] = [];
      let filename = '';

      if (exportType === 'work' || exportType === 'combined') {
        const response = await fetch(`/api/v1/time-entries?start_date=${start_date}&end_date=${end_date}`);
        if (response.ok) {
          const result = await response.json();
          const workData = (result.entries || []).map((entry: any) => ({
            type: 'work',
            date: format(new Date(entry.clock_in), 'yyyy-MM-dd'),
            start_time: format(new Date(entry.clock_in), 'HH:mm'),
            end_time: entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'Active',
            duration_minutes: entry.duration_minutes || 0,
            duration_formatted: formatMinutesToHours(entry.duration_minutes || 0),
            group_id: entry.group_id || '',
            metadata: JSON.stringify(entry.metadata || {})
          }));
          data.push(...workData);
        }
      }

      if (exportType === 'habits' || exportType === 'combined') {
        const response = await fetch(`/api/v1/habits/entries?start_date=${start_date.split('T')[0]}&end_date=${end_date.split('T')[0]}`);
        if (response.ok) {
          const result = await response.json();
          const habitsData = (result.entries || []).map((entry: any) => ({
            type: 'habit',
            date: entry.entry_date,
            habit_name: entry.habit_name,
            habit_category: entry.habit_category,
            entry_type: entry.entry_type,
            completed_at: format(new Date(entry.completed_at), 'HH:mm'),
            count_value: entry.count_value || '',
            target_value: entry.target_value || '',
            notes: entry.notes || ''
          }));
          data.push(...habitsData);
        }
      }

      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      filename = `${exportType}-export-${dateStr}.${exportFormat}`;

      // Export data
      if (exportFormat === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export for the selected criteria.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export for the selected criteria.');
      return;
    }

    const jsonContent = JSON.stringify({
      export_info: {
        type: exportType,
        date_range: dateRange,
        generated_at: new Date().toISOString(),
        total_records: data.length
      },
      data
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
      default: return 'Last 7 Days';
    }
  };

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

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export Reports</h1>
        <p className="text-gray-600">
          Export your time tracking and habit data
        </p>
      </div>

      {/* Export Type Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Export</h3>
          <div className="space-y-3">
            {[
              { id: 'work', label: 'Work Time Only', icon: Clock, color: 'blue' },
              { id: 'habits', label: 'Habits Only', icon: Target, color: 'green' },
              { id: 'combined', label: 'Both Work & Habits', icon: CheckCircle2, color: 'purple' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setExportType(option.id as ExportType)}
                className={`w-full flex items-center p-4 rounded-xl border-2 transition-colors ${
                  exportType === option.id
                    ? `border-${option.color}-300 bg-${option.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option.icon className={`h-5 w-5 mr-3 ${
                  exportType === option.id ? `text-${option.color}-600` : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  exportType === option.id ? `text-${option.color}-900` : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                {exportType === option.id && (
                  <CheckCircle2 className={`h-4 w-4 ml-auto text-${option.color}-600`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['today', 'week', 'month', 'custom'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === 'today' ? 'Today' :
                 range === 'week' ? 'This Week' :
                 range === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex items-center p-4 rounded-xl border-2 transition-colors ${
                exportFormat === 'csv'
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`h-5 w-5 mr-3 ${
                exportFormat === 'csv' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  exportFormat === 'csv' ? 'text-green-900' : 'text-gray-700'
                }`}>
                  CSV
                </div>
                <div className="text-xs text-gray-500">For spreadsheets</div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('json')}
              className={`flex items-center p-4 rounded-xl border-2 transition-colors ${
                exportFormat === 'json'
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <File className={`h-5 w-5 mr-3 ${
                exportFormat === 'json' ? 'text-purple-600' : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  exportFormat === 'json' ? 'text-purple-900' : 'text-gray-700'
                }`}>
                  JSON
                </div>
                <div className="text-xs text-gray-500">For developers</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={exportData}
          disabled={loading || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
          className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-2xl font-medium transition-colors flex items-center justify-center ${
            loading ? 'cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <Download className="h-5 w-5 mr-2" />
          )}
          {loading ? 'Generating Export...' : `Export ${getDateRangeLabel()}`}
        </button>
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 rounded-2xl p-4">
        <div className="flex items-start">
          <Settings className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Export Settings</p>
            <ul className="space-y-1 text-xs">
              <li>• {exportType === 'work' ? 'Work time entries' : exportType === 'habits' ? 'Habit tracking entries' : 'Combined work and habit data'}</li>
              <li>• {getDateRangeLabel()} data range</li>
              <li>• {exportFormat.toUpperCase()} format</li>
              <li>• Downloads automatically to your device</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}