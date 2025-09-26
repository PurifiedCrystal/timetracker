import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { HabitService } from '@/services/HabitService';
import { MockDataService } from '@/lib/mock-data';
import type { CreateHabitEntryRequest } from '@/types/habit';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    // Commented out real auth for testing
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json() as CreateHabitEntryRequest;

    // Validate required fields
    if (!body.habit_name || body.habit_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    if (!body.entry_type || !['completion', 'duration', 'count'].includes(body.entry_type)) {
      return NextResponse.json(
        { error: 'Valid entry type is required (completion, duration, count)' },
        { status: 400 }
      );
    }

    const { data: entry, error } = await MockDataService.createHabitEntry(user.id, body);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      entry,
      message: 'Habit entry created successfully'
    });

  } catch (error) {
    console.error('Create habit entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    // Commented out real auth for testing
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const habitName = searchParams.get('habit_name');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Provide default dates if not specified
    const today = new Date().toISOString().split('T')[0];
    const defaultStartDate = startDate || today;
    const defaultEndDate = endDate || today;

    const { data: entries, error } = await MockDataService.getHabitEntries(user.id, defaultStartDate, defaultEndDate);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      entries
    });

  } catch (error) {
    console.error('Get habit entries API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}