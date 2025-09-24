import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TimeEntryService } from '@/services/TimeEntryService';
import { TimeEntryQueryOptions } from '@/types/time-entry';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const options: TimeEntryQueryOptions = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    // Get time entries
    const { data: entries, error } = await TimeEntryService.getTimeEntries(session.user.id, options);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: entries || [],
      total: entries?.length || 0
    });

  } catch (error) {
    console.error('Time entries API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { metadata = {} } = body;

    // Clock in (create new time entry)
    const { data: timeEntry, error } = await TimeEntryService.clockIn(session.user.id, metadata);

    if (error) {
      if (error.includes('already clocked in')) {
        return NextResponse.json(
          { error },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      entry: timeEntry
    }, { status: 201 });

  } catch (error) {
    console.error('Clock in API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}