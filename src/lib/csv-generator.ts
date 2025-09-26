/**
 * Simple CSV generation utilities
 */

export function generateTimeTrackingCSV(exportData: any): string {
  const headers = [
    'Date',
    'Clock In',
    'Clock Out',
    'Duration (Hours)',
    'Break (Minutes)',
    'Overtime (Minutes)',
    'Group'
  ];

  const rows = exportData.entries.map((entry: any) => [
    entry.date,
    entry.clock_in,
    entry.clock_out,
    entry.duration_hours.toString(),
    entry.break_minutes.toString(),
    entry.overtime_minutes.toString(),
    entry.group || 'Personal'
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['SUMMARY', '', '', '', '', '', '']);
  rows.push(['Total Entries', exportData.summary.total_entries.toString(), '', '', '', '', '']);
  rows.push(['Total Hours', exportData.summary.total_hours.toString(), '', '', '', '', '']);
  rows.push(['Total Breaks (Minutes)', exportData.summary.total_breaks_minutes.toString(), '', '', '', '', '']);
  rows.push(['Total Overtime (Minutes)', exportData.summary.total_overtime_minutes.toString(), '', '', '', '', '']);
  rows.push(['Average Hours/Day', exportData.summary.average_hours_per_day.toString(), '', '', '', '', '']);

  return generateCSV(headers, rows);
}

export function generateHabitsCSV(exportData: any): string {
  const headers = [
    'Date',
    'Habit Name',
    'Category',
    'Type',
    'Completed At',
    'Duration (Minutes)',
    'Count',
    'Mood Rating',
    'Notes'
  ];

  const rows = exportData.entries.map((entry: any) => [
    entry.date,
    entry.habit_name,
    entry.category,
    entry.type,
    entry.completed_at || '',
    entry.duration_minutes?.toString() || '',
    entry.count_value?.toString() || '',
    entry.mood_rating?.toString() || '',
    entry.notes || ''
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['SUMMARY', '', '', '', '', '', '', '', '']);
  rows.push(['Total Entries', exportData.summary.total_entries.toString(), '', '', '', '', '', '', '']);
  rows.push(['Unique Habits', exportData.summary.unique_habits.toString(), '', '', '', '', '', '', '']);
  rows.push(['Completed Days', exportData.summary.completed_days.toString(), '', '', '', '', '', '', '']);
  rows.push(['Avg Entries/Day', exportData.summary.average_entries_per_day.toString(), '', '', '', '', '', '', '']);

  return generateCSV(headers, rows);
}

function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCsvField = (field: string): string => {
    if (field.includes('"') || field.includes(',') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvHeaders = headers.map(escapeCsvField).join(',');
  const csvRows = rows.map(row =>
    row.map(field => escapeCsvField(field || '')).join(',')
  ).join('\n');

  return `${csvHeaders}\n${csvRows}`;
}