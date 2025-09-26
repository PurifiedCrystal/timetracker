'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Download, DollarSign, Clock, Users } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface GroupReport {
  group_id: string;
  group_name: string;
  period: {
    start_date: string;
    end_date: string;
  };
  generated_at: string;
  generated_by: string;
  california_mode?: boolean;
  members: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    total_minutes: number;
    total_hours: number;
    entries: any[];
    earnings?: {
      total_earnings: number;
      regular_earnings: number;
      overtime_earnings: number;
      regular_hours: number;
      overtime_hours: number;
    };
  }>;
  summary: {
    total_members: number;
    total_hours: number;
    total_earnings?: number;
  };
}

export default function GroupReportPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const groupId = params.groupId as string;

  const [report, setReport] = useState<{ group_report: GroupReport } | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeEarnings, setIncludeEarnings] = useState(false);
  const [californiaMode, setCaliforniaMode] = useState(false);

  useEffect(() => {
    // Set default dates (current week)
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(weekEnd.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate, includeEarnings, californiaMode]);

  const loadReport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        include_earnings: includeEarnings.toString(),
        california_mode: californiaMode.toString()
      });

      const response = await fetch(`/api/v1/reports/group/${groupId}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const csvData = [
      ['Member Name', 'Email', 'Hours Worked', 'Earnings (if enabled)'],
      ...report.group_report.members.map(member => [
        member.user_name,
        member.user_email,
        member.total_hours.toFixed(2),
        member.earnings ? `$${member.earnings.total_earnings.toFixed(2)}` : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-report-${groupId}-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="pb-20 max-w-md mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading report...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="pb-20 max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/groups')}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Failed to load report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-md mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/groups')}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Group Report</h1>
        <p className="text-gray-600">{report.group_report.group_name}</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Settings</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Include Earnings
              </label>
              <input
                type="checkbox"
                checked={includeEarnings}
                onChange={(e) => setIncludeEarnings(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            {includeEarnings && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  California Mode
                </label>
                <input
                  type="checkbox"
                  checked={californiaMode}
                  onChange={(e) => setCaliforniaMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-xl font-bold text-gray-900">{report.group_report.summary.total_members}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-xl font-bold text-gray-900">{report.group_report.summary.total_hours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {report.group_report.summary.total_earnings && (
          <div className="col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl font-bold text-gray-900">${report.group_report.summary.total_earnings.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={exportReport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-medium transition-colors flex items-center justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Member Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Member Details</h3>

        {report.group_report.members.map((member) => (
          <div key={member.user_id} className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{member.user_name}</h4>
                <p className="text-sm text-gray-600">{member.user_email}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{member.total_hours.toFixed(1)}h</p>
                {member.earnings && (
                  <p className="text-sm text-green-600">${member.earnings.total_earnings.toFixed(2)}</p>
                )}
              </div>
            </div>

            {member.earnings && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Regular Hours</p>
                  <p className="font-medium">{member.earnings.regular_hours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-gray-600">Overtime Hours</p>
                  <p className="font-medium">{member.earnings.overtime_hours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-gray-600">Regular Pay</p>
                  <p className="font-medium">${member.earnings.regular_earnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Overtime Pay</p>
                  <p className="font-medium">${member.earnings.overtime_earnings.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}