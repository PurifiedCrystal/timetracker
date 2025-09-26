import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { habits } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const reportType = searchParams.get('type') || 'summary';

    let report: any = {};

    // Get basic habit report
    const { data: reportEntries, error: reportError } = await habits.getReports(
      user.id,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0]
    );

    if (reportError) {
      return NextResponse.json({ error: reportError }, { status: 400 });
    }

    const { data: stats, error: statsError } = await habits.getStats(user.id);

    if (statsError) {
      return NextResponse.json({ error: statsError }, { status: 400 });
    }

    // Group entries by habit
    const entriesArray = Array.isArray(reportEntries) ? reportEntries : [];
    const habitGroups = entriesArray.reduce((groups: any, entry: any) => {
      const key = entry.habit_name;
      if (!groups[key]) {
        groups[key] = {
          habit_name: entry.habit_name,
          habit_category: entry.habit_category,
          entries: []
        };
      }
      groups[key].entries.push(entry);
      return groups;
    }, {});

    report = {
      type: reportType,
      period: {
        start_date: startDate,
        end_date: endDate
      },
      generated_at: new Date().toISOString(),
      user_id: user.id,
      stats,
      total_entries: entriesArray.length,
      unique_habits: Object.keys(habitGroups).length,
      habits: Object.values(habitGroups)
    };

    return NextResponse.json({
      habit_report: report
    });

  } catch (error) {
    console.error('Habit reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}