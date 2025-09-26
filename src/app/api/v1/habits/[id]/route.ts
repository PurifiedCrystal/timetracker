import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { HabitService } from '@/services/HabitService';
import type { UpdateHabitEntryRequest } from '@/types/habit';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: habitEntry, error } = await HabitService.getHabitEntry(params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Habit entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      habit_entry: habitEntry
    });

  } catch (error) {
    console.error('Get habit entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as UpdateHabitEntryRequest;

    // Validate mood rating if provided
    if (body.mood_rating && (body.mood_rating < 1 || body.mood_rating > 5)) {
      return NextResponse.json(
        { error: 'Mood rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate timed entry requirements
    if (body.start_time && body.end_time) {
      const start = new Date(body.start_time);
      const end = new Date(body.end_time);
      if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const { data: habitEntry, error } = await HabitService.updateHabitEntry(params.id, body);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Habit entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      habit_entry: habitEntry,
      message: 'Habit entry updated successfully'
    });

  } catch (error) {
    console.error('Update habit entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await HabitService.deleteHabitEntry(params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Habit entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Habit entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete habit entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}