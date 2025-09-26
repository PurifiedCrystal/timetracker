import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { exports, subscriptions } from '@/lib/database';
import { GenerateExportRequest, isValidExportFormat } from '@/types/export';

export async function POST(request: NextRequest) {
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

    // Check if user has active subscription
    const { data: subscription } = await subscriptions.get(user.id);
    const subscriptionData = subscription as any;
    if (!subscriptionData || !['active', 'trialing'].includes(subscriptionData.status)) {
      return NextResponse.json(
        { error: 'Active subscription required for exports' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type = 'time_tracking',
      format,
      start_date,
      end_date,
      group_id,
      habit_name,
      category,
      include_breaks,
      include_overtime
    } = body;

    // Validate required fields
    if (!format || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Format, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    // Validate export type
    if (!['time_tracking', 'habits'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type. Must be time_tracking or habits' },
        { status: 400 }
      );
    }

    // Validate export format
    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Supported: csv, pdf' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Generate export based on type
    let exportData;
    let error;

    if (type === 'time_tracking') {
      const result = await exports.generateTimeTracking(user.id, {
        startDate: start_date,
        endDate: end_date,
        format: format as 'csv' | 'pdf',
        groupId: group_id,
        includeBreaks: include_breaks !== false
      });
      exportData = result.data;
      error = result.error;
    } else if (type === 'habits') {
      const result = await exports.generateHabits(user.id, {
        startDate: start_date,
        endDate: end_date,
        format: format as 'csv' | 'pdf',
        habitName: habit_name,
        category
      });
      exportData = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      export: exportData
    });

  } catch (error) {
    console.error('Generate export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}