'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  metadata: any;
  group_id?: string;
}

interface ChartData {
  date: string;
  hours: number;
  entries: number;
}

interface WeeklySummary {
  week: string;
  totalHours: number;
  averageDaily: number;
  workingDays: number;
}

interface MonthlySummary {
  month: string;
  totalHours: number;
  workingDays: number;
  averageDaily: number;
}

interface TimeChartsProps {
  timeEntries: TimeEntry[];
  dateRange: string;
}

export default function TimeCharts({ timeEntries, dateRange }: TimeChartsProps) {
  // Convert time entries to daily chart data
  const getDailyChartData = (): ChartData[] => {
    const dailyData: { [key: string]: { hours: number; entries: number } } = {};

    timeEntries.forEach(entry => {
      const date = format(parseISO(entry.clock_in), 'yyyy-MM-dd');
      const hours = (entry.duration_minutes || 0) / 60;

      if (!dailyData[date]) {
        dailyData[date] = { hours: 0, entries: 0 };
      }

      dailyData[date].hours += hours;
      dailyData[date].entries += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: format(parseISO(date), 'MMM dd'),
        hours: Math.round(data.hours * 100) / 100,
        entries: data.entries
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get weekly summary data
  const getWeeklySummary = (): WeeklySummary[] => {
    const weeklyData: { [key: string]: { hours: number; days: Set<string> } } = {};

    timeEntries.forEach(entry => {
      const date = parseISO(entry.clock_in);
      const weekStart = format(date, 'yyyy-MM-dd');
      const dayString = format(date, 'yyyy-MM-dd');
      const hours = (entry.duration_minutes || 0) / 60;

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { hours: 0, days: new Set() };
      }

      weeklyData[weekStart].hours += hours;
      weeklyData[weekStart].days.add(dayString);
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
      week: format(parseISO(week), 'MMM dd'),
      totalHours: Math.round(data.hours * 100) / 100,
      workingDays: data.days.size,
      averageDaily: Math.round((data.hours / data.days.size) * 100) / 100
    }));
  };

  // Get monthly summary data
  const getMonthlySummary = (): MonthlySummary[] => {
    const monthlyData: { [key: string]: { hours: number; days: Set<string> } } = {};

    timeEntries.forEach(entry => {
      const date = parseISO(entry.clock_in);
      const monthKey = format(date, 'yyyy-MM');
      const dayString = format(date, 'yyyy-MM-dd');
      const hours = (entry.duration_minutes || 0) / 60;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { hours: 0, days: new Set() };
      }

      monthlyData[monthKey].hours += hours;
      monthlyData[monthKey].days.add(dayString);
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy'),
      totalHours: Math.round(data.hours * 100) / 100,
      workingDays: data.days.size,
      averageDaily: Math.round((data.hours / data.days.size) * 100) / 100
    }));
  };

  const dailyData = getDailyChartData();
  const weeklyData = getWeeklySummary();
  const monthlyData = getMonthlySummary();

  if (timeEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Patterns</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No time entries found for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Time Pattern Line Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Time Pattern</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} ${name === 'hours' ? 'hours' : 'entries'}`,
                name === 'hours' ? 'Hours Worked' : 'Sessions'
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Hours Worked"
            />
            <Line
              type="monotone"
              dataKey="entries"
              stroke="#10b981"
              strokeWidth={2}
              name="Sessions"
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Summary Bar Chart */}
      {weeklyData.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} ${name === 'totalHours' ? 'hours' : name === 'workingDays' ? 'days' : 'hrs/day'}`,
                  name === 'totalHours' ? 'Total Hours' : name === 'workingDays' ? 'Working Days' : 'Daily Average'
                ]}
              />
              <Legend />
              <Bar dataKey="totalHours" fill="#3b82f6" name="Total Hours" />
              <Bar dataKey="averageDaily" fill="#10b981" name="Daily Average" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Summary */}
      {monthlyData.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {monthlyData.slice(-3).map((month) => (
              <div key={month.month} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{month.month}</h4>
                <p className="text-2xl font-bold text-blue-600">{month.totalHours}h</p>
                <p className="text-sm text-gray-500">
                  {month.workingDays} days • {month.averageDaily}h avg
                </p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} ${name === 'totalHours' ? 'hours' : 'days'}`,
                  name === 'totalHours' ? 'Total Hours' : 'Working Days'
                ]}
              />
              <Legend />
              <Bar dataKey="totalHours" fill="#3b82f6" name="Total Hours" />
              <Bar dataKey="workingDays" fill="#f59e0b" name="Working Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}