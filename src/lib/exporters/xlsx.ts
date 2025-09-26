/**
 * Excel (XLSX) export generator for time tracking data
 */
import * as XLSX from 'xlsx';

interface TimeTrackingExcelData {
  entries: Array<{
    date: string;
    clock_in: string;
    clock_out: string;
    duration_hours: number;
    break_minutes: number;
    overtime_minutes: number;
    group?: string;
    notes?: string;
  }>;
  summary: {
    total_entries: number;
    total_hours: number;
    total_breaks_minutes: number;
    total_overtime_minutes: number;
    average_hours_per_day: number;
  };
  user: {
    name: string;
    email: string;
    period: string;
  };
}

interface HabitsExcelData {
  entries: Array<{
    date: string;
    habit_name: string;
    category: string;
    type: string;
    completed_at?: string;
    duration_minutes?: number;
    count_value?: number;
    mood_rating?: number;
    notes?: string;
  }>;
  summary: {
    total_entries: number;
    unique_habits: number;
    completed_days: number;
    average_entries_per_day: number;
  };
  user: {
    name: string;
    email: string;
    period: string;
  };
}

export function generateTimeTrackingExcel(exportData: TimeTrackingExcelData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Create Summary Sheet
  const summaryData = [
    ['Time Tracking Report'],
    [''],
    ['User Information'],
    ['Name', exportData.user.name],
    ['Email', exportData.user.email],
    ['Period', exportData.user.period],
    ['Generated', new Date().toLocaleDateString()],
    [''],
    ['Summary Statistics'],
    ['Total Entries', exportData.summary.total_entries],
    ['Total Hours', exportData.summary.total_hours.toFixed(2)],
    ['Total Break Time (minutes)', exportData.summary.total_breaks_minutes],
    ['Total Overtime (minutes)', exportData.summary.total_overtime_minutes],
    ['Average Hours per Day', exportData.summary.average_hours_per_day.toFixed(2)]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Style the summary sheet
  summarySheet['!cols'] = [
    { width: 25 },
    { width: 20 }
  ];

  // Add summary sheet to workbook
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create Time Entries Sheet
  const entriesData = [
    ['Date', 'Clock In', 'Clock Out', 'Duration (Hours)', 'Break (Minutes)', 'Overtime (Minutes)', 'Group', 'Notes']
  ];

  exportData.entries.forEach(entry => {
    entriesData.push([
      entry.date,
      entry.clock_in,
      entry.clock_out,
      entry.duration_hours,
      entry.break_minutes,
      entry.overtime_minutes,
      entry.group || 'Personal',
      entry.notes || ''
    ]);
  });

  const entriesSheet = XLSX.utils.aoa_to_sheet(entriesData);

  // Style the entries sheet
  entriesSheet['!cols'] = [
    { width: 12 },  // Date
    { width: 10 },  // Clock In
    { width: 10 },  // Clock Out
    { width: 12 },  // Duration
    { width: 12 },  // Break
    { width: 14 },  // Overtime
    { width: 12 },  // Group
    { width: 30 }   // Notes
  ];

  // Add formulas for totals
  const lastRow = entriesData.length + 1;
  entriesSheet[`C${lastRow}`] = { t: 's', v: 'TOTALS:' };
  entriesSheet[`D${lastRow}`] = { t: 'n', f: `SUM(D2:D${lastRow - 1})` };
  entriesSheet[`E${lastRow}`] = { t: 'n', f: `SUM(E2:E${lastRow - 1})` };
  entriesSheet[`F${lastRow}`] = { t: 'n', f: `SUM(F2:F${lastRow - 1})` };

  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Time Entries');

  // Create Daily Summary Sheet
  const dailySummaryData = [['Date', 'Total Hours', 'Sessions', 'Overtime (Minutes)', 'Average Session (Hours)']];

  // Group entries by date
  const dailyGroups: { [date: string]: typeof exportData.entries } = {};
  exportData.entries.forEach(entry => {
    if (!dailyGroups[entry.date]) {
      dailyGroups[entry.date] = [];
    }
    dailyGroups[entry.date].push(entry);
  });

  Object.entries(dailyGroups).forEach(([date, entries]) => {
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration_hours, 0);
    const totalOvertime = entries.reduce((sum, entry) => sum + entry.overtime_minutes, 0);
    const sessionCount = entries.length;
    const averageSession = totalHours / sessionCount;

    dailySummaryData.push([
      date,
      totalHours.toFixed(2),
      sessionCount,
      totalOvertime,
      averageSession.toFixed(2)
    ]);
  });

  const dailySummarySheet = XLSX.utils.aoa_to_sheet(dailySummaryData);
  dailySummarySheet['!cols'] = [
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 18 }
  ];

  XLSX.utils.book_append_sheet(workbook, dailySummarySheet, 'Daily Summary');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateHabitsExcel(exportData: HabitsExcelData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Create Summary Sheet
  const summaryData = [
    ['Habits Tracking Report'],
    [''],
    ['User Information'],
    ['Name', exportData.user.name],
    ['Email', exportData.user.email],
    ['Period', exportData.user.period],
    ['Generated', new Date().toLocaleDateString()],
    [''],
    ['Summary Statistics'],
    ['Total Entries', exportData.summary.total_entries],
    ['Unique Habits', exportData.summary.unique_habits],
    ['Completed Days', exportData.summary.completed_days],
    ['Average Entries per Day', exportData.summary.average_entries_per_day.toFixed(1)]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ width: 25 }, { width: 20 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create Habits Entries Sheet
  const entriesData = [
    ['Date', 'Habit Name', 'Category', 'Type', 'Completed At', 'Duration (Minutes)', 'Count', 'Mood Rating', 'Notes']
  ];

  exportData.entries.forEach(entry => {
    entriesData.push([
      entry.date,
      entry.habit_name,
      entry.category,
      entry.type,
      entry.completed_at || '',
      entry.duration_minutes || '',
      entry.count_value || '',
      entry.mood_rating || '',
      entry.notes || ''
    ]);
  });

  const entriesSheet = XLSX.utils.aoa_to_sheet(entriesData);
  entriesSheet['!cols'] = [
    { width: 12 },  // Date
    { width: 20 },  // Habit Name
    { width: 15 },  // Category
    { width: 12 },  // Type
    { width: 15 },  // Completed At
    { width: 16 },  // Duration
    { width: 10 },  // Count
    { width: 12 },  // Mood Rating
    { width: 30 }   // Notes
  ];

  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Habit Entries');

  // Create Habits Analysis Sheet
  const habitStats: { [habitName: string]: { count: number; totalDuration: number; moods: number[] } } = {};

  exportData.entries.forEach(entry => {
    if (!habitStats[entry.habit_name]) {
      habitStats[entry.habit_name] = { count: 0, totalDuration: 0, moods: [] };
    }

    habitStats[entry.habit_name].count++;
    habitStats[entry.habit_name].totalDuration += entry.duration_minutes || 0;

    if (entry.mood_rating) {
      habitStats[entry.habit_name].moods.push(entry.mood_rating);
    }
  });

  const analysisData = [
    ['Habit Name', 'Total Count', 'Avg Duration (min)', 'Avg Mood Rating', 'Category']
  ];

  Object.entries(habitStats).forEach(([habitName, stats]) => {
    const avgDuration = stats.totalDuration / stats.count;
    const avgMood = stats.moods.length > 0
      ? stats.moods.reduce((sum, mood) => sum + mood, 0) / stats.moods.length
      : 0;

    const habitEntry = exportData.entries.find(e => e.habit_name === habitName);
    const category = habitEntry?.category || '';

    analysisData.push([
      habitName,
      stats.count,
      avgDuration.toFixed(1),
      avgMood.toFixed(1),
      category
    ]);
  });

  const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
  analysisSheet['!cols'] = [
    { width: 25 },
    { width: 12 },
    { width: 18 },
    { width: 16 },
    { width: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Habit Analysis');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCombinedExcel(timeData: TimeTrackingExcelData, habitsData: HabitsExcelData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Create Combined Overview Sheet
  const overviewData = [
    ['Combined Activity Report'],
    [''],
    ['User Information'],
    ['Name', timeData.user.name],
    ['Email', timeData.user.email],
    ['Period', timeData.user.period],
    ['Generated', new Date().toLocaleDateString()],
    [''],
    ['Work Time Summary'],
    ['Total Work Hours', timeData.summary.total_hours.toFixed(2)],
    ['Work Sessions', timeData.summary.total_entries],
    ['Average Work Hours/Day', timeData.summary.average_hours_per_day.toFixed(2)],
    ['Total Overtime (minutes)', timeData.summary.total_overtime_minutes],
    [''],
    ['Habits Summary'],
    ['Total Habit Entries', habitsData.summary.total_entries],
    ['Unique Habits', habitsData.summary.unique_habits],
    ['Completed Days', habitsData.summary.completed_days],
    ['Average Habits/Day', habitsData.summary.average_entries_per_day.toFixed(1)]
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  overviewSheet['!cols'] = [{ width: 25 }, { width: 20 }];

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Add individual sheets from each generator
  const timeWorkbook = XLSX.read(generateTimeTrackingExcel(timeData), { type: 'buffer' });
  const habitsWorkbook = XLSX.read(generateHabitsExcel(habitsData), { type: 'buffer' });

  // Copy time tracking sheets
  XLSX.utils.book_append_sheet(workbook, timeWorkbook.Sheets['Time Entries'], 'Work Time Entries');
  XLSX.utils.book_append_sheet(workbook, timeWorkbook.Sheets['Daily Summary'], 'Work Daily Summary');

  // Copy habits sheets
  XLSX.utils.book_append_sheet(workbook, habitsWorkbook.Sheets['Habit Entries'], 'Habit Entries');
  XLSX.utils.book_append_sheet(workbook, habitsWorkbook.Sheets['Habit Analysis'], 'Habit Analysis');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}