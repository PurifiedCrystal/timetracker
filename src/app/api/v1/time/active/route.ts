import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TimeEntryService } from '@/services/TimeEntryService';

export async function GET(request: NextRequest) {
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

    // Get active time entry
    const { data: activeEntry, error } = await TimeEntryService.getActiveTimeEntry(session.user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    // If no active entry, return null
    if (!activeEntry) {
      return NextResponse.json({
        entry: null,
        is_clocked_in: false,
        current_duration: 0
      });
    }

    // Get current session duration
    const currentDuration = await TimeEntryService.getCurrentSessionDuration(session.user.id);

    return NextResponse.json({
      entry: activeEntry,
      is_clocked_in: true,
      current_duration: currentDuration
    });

  } catch (error) {
    console.error('Active time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}