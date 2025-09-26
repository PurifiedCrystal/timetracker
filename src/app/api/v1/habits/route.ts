import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { habits } from '@/lib/database';
import type { CreateHabitEntryRequest } from '@/types/habit';

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

    const body = await request.json() as CreateHabitEntryRequest;

    // Validate required fields
    if (!body.habit_name || body.habit_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    if (!body.entry_type || !['completion', 'timed', 'counter'].includes(body.entry_type)) {
      return NextResponse.json(
        { error: 'Valid entry type is required (completion, timed, or counter)' },
        { status: 400 }
      );
    }

    // Validate mood rating if provided
    if (body.mood_rating && (body.mood_rating < 1 || body.mood_rating > 5)) {
      return NextResponse.json(
        { error: 'Mood rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate timed entry requirements
    if (body.entry_type === 'timed' && body.start_time && body.end_time) {
      const start = new Date(body.start_time);
      const end = new Date(body.end_time);
      if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const { data: habitEntry, error } = await habits.create(user.id, body);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      habit_entry: habitEntry,
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entryDate = searchParams.get('entry_date') || undefined;

    const { data: habitEntries, error } = await habits.list(user.id, { entry_date: entryDate });

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      habit_entries: habitEntries
    });

  } catch (error) {
    console.error('Get habit entries API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}