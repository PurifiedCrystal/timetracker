'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Users,
  Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type ExportFormat = 'csv' | 'pdf' | 'excel';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all_time' | 'custom_range';

interface Group {
  id: string;
  name: string;
  role: 'admin' | 'member';
  members: number;
}

export default function ExportPage() {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('personal');
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    // Update custom date fields when date range changes
    if (dateRange !== 'custom_range') {
      const { start_date, end_date } = getDateRangeParams();
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      setCustomStartDate(format(startDate, 'yyyy-MM-dd'));
      setCustomEndDate(format(endDate, 'yyyy-MM-dd'));
    }
  }, [dateRange]);

  const loadGroups = async () => {
    try {
      // Try to load from API first
      try {
        const response = await fetch('/api/v1/groups');
        if (response.ok) {
          const data = await response.json();
          const apiGroups = (data.data || data.groups || [])
            .filter((group: any) => !group.deleted_at)
            .map((group: any) => ({
              id: group.id,
              name: group.name,
              role: group.role || group.group_memberships?.[0]?.role || 'admin',
              members: group.member_count || group.members_count || 1,
            }));
          setGroups(apiGroups);
          setLoadingGroups(false);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const savedGroups = localStorage.getItem('user_groups');
      if (savedGroups) {
        const parsedGroups: Group[] = JSON.parse(savedGroups);
        // Filter out mock "Design Team" group
        const validGroups = parsedGroups.filter(group => group.name !== 'Design Team');
        setGroups(validGroups);
        // Update localStorage to remove the mock data
        if (validGroups.length !== parsedGroups.length) {
          localStorage.setItem('user_groups', JSON.stringify(validGroups));
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

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
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0, 23, 59, 59);
        startDate = quarterStart;
        endDate = quarterEnd;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'all_time':
        startDate = new Date(2020, 0, 1); // Reasonable start date
        endDate = now;
        break;
      case 'custom_range':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 0 });
        endDate = endOfWeek(now, { weekStartsOn: 0 });
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

      // Export work time data only
      let apiUrl = `/api/v1/time-entries?start_date=${start_date}&end_date=${end_date}`;
      if (selectedGroupId !== 'personal') {
        apiUrl += `&group_id=${selectedGroupId}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const result = await response.json();
        const workData = (result.entries || []).map((entry: any) => ({
          date: format(new Date(entry.clock_in), 'yyyy-MM-dd'),
          start_time: format(new Date(entry.clock_in), 'HH:mm'),
          end_time: entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'Active',
          duration_minutes: entry.duration_minutes || 0,
          duration_formatted: formatMinutesToHours(entry.duration_minutes || 0),
          group_id: entry.group_id || '',
          user_id: entry.user_id || '',
          user_name: entry.user_name || 'Unknown User',
          break_minutes: entry.break_minutes || 0,
          overtime_minutes: entry.overtime_minutes || 0
        }));

        data.push(...workData);
      }

      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const groupSuffix = selectedGroupId === 'personal' ? '' : `-${selectedGroupId}`;
      filename = `time-export${groupSuffix}-${dateStr}.${exportFormat}`;

      // Export data
      if (exportFormat === 'csv') {
        exportToCSV(data, filename);
      } else if (exportFormat === 'pdf') {
        exportToPDF(data, filename);
      } else if (exportFormat === 'excel') {
        exportToExcel(data, filename);
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
        type: 'work',
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

  const exportToPDF = (data: any[], filename: string) => {
    // For now, create a simple PDF alert - would need jsPDF library for full implementation
    alert('PDF export coming soon! For now, please use CSV format.');
  };

  const exportToExcel = (data: any[], filename: string) => {
    // For now, create Excel-compatible CSV
    exportToCSV(data, filename.replace('.excel', '.csv'));
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
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'all_time': return 'All Time';
      case 'custom_range':
        if (customStartDate && customEndDate) {
          return `${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d')}`;
        }
        return 'Custom Range';
      default: return 'This Week';
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
          Export your work time tracking data
        </p>
      </div>


      {/* Group Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Source</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedGroupId('personal')}
              className={`w-full flex items-center p-4 rounded-xl border-2 transition-colors ${
                selectedGroupId === 'personal'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`h-5 w-5 mr-3 ${
                selectedGroupId === 'personal' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1 text-left">
                <span className={`font-medium ${
                  selectedGroupId === 'personal' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  Personal Data Only
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  Export only your individual time tracking data
                </div>
              </div>
              {selectedGroupId === 'personal' && (
                <CheckCircle2 className="h-4 w-4 ml-auto text-blue-600" />
              )}
            </button>

            {!loadingGroups && groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full flex items-center p-4 rounded-xl border-2 transition-colors ${
                  selectedGroupId === group.id
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mr-3">
                  <Crown className={`h-5 w-5 ${
                    selectedGroupId === group.id ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      selectedGroupId === group.id ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {group.name}
                    </span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      group.role === 'admin'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {group.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Export data for all {group.members} group members
                  </div>
                </div>
                {selectedGroupId === group.id && (
                  <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />
                )}
              </button>
            ))}

            {loadingGroups && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600">Loading groups...</span>
              </div>
            )}

            {!loadingGroups && groups.length === 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No groups found</p>
                <p className="text-xs text-gray-500 mt-1">Create a group to export group data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {(['today', 'week', 'month', 'quarter', 'year', 'all_time'] as DateRange[]).map((range) => (
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
                 range === 'month' ? 'This Month' :
                 range === 'quarter' ? 'This Quarter' :
                 range === 'year' ? 'This Year' : 'All Time'}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setDateRange('custom_range');
              }}
              className="w-full p-2 border rounded"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setDateRange('custom_range');
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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
                <div className="text-xs text-gray-500">.csv file</div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('pdf')}
              className={`flex items-center p-4 rounded-xl border-2 transition-colors ${
                exportFormat === 'pdf'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileDown className={`h-5 w-5 mr-3 ${
                exportFormat === 'pdf' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  exportFormat === 'pdf' ? 'text-red-900' : 'text-gray-700'
                }`}>
                  PDF
                </div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('excel')}
              className={`flex items-center p-4 rounded-xl border-2 transition-colors ${
                exportFormat === 'excel'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <File className={`h-5 w-5 mr-3 ${
                exportFormat === 'excel' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  exportFormat === 'excel' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  Excel
                </div>
                <div className="text-xs text-gray-500">ms xmlx file</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={exportData}
          disabled={loading}
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
              <li>• Work time entries only</li>
              <li>• {selectedGroupId === 'personal' ? 'Personal data only' : `Group: ${groups.find(g => g.id === selectedGroupId)?.name || 'Selected Group'}`}</li>
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