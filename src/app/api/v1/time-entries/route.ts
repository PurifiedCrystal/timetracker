import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TimeEntryQueryOptions } from '@/types/time-entry';
import { timeEntries } from '@/lib/database';
import { getActiveSession, setActiveSession, getTimeEntries } from '@/lib/mock-session';

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

    // Get time entries from database
    try {
      const { data: entries, error } = await timeEntries.list(user.id, options);

      if (!error && entries) {
        const entriesArray = Array.isArray(entries) ? entries : [];
        return NextResponse.json({
          entries: entriesArray,
          total: entriesArray.length
        });
      }
    } catch (dbError) {
      console.log('Database operation failed, using mock response:', dbError);
    }

    // Return mock entries from in-memory storage if database fails
    const mockEntries = getTimeEntries();
    return NextResponse.json({
      entries: mockEntries,
      total: mockEntries.length
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

    // Check if user already has an active time entry (including mock session)
    const existingActive = getActiveSession();
    if (existingActive && existingActive.user_id === user.id && !existingActive.clock_out) {
      return NextResponse.json(
        { error: 'User already clocked in' },
        { status: 409 }
      );
    }

    try {
      const { data: activeEntry } = await timeEntries.getActive(user.id);
      if (activeEntry) {
        return NextResponse.json(
          { error: 'User already clocked in' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      // Database error, but we can still check mock session
      console.log('Database check failed, continuing with mock session check');
    }

    const body = await request.json();
    const { metadata = {}, group_id } = body;

    // Create new time entry
    const entryData: any = {
      clock_in: new Date().toISOString(),
      metadata
    };

    // Add group_id if provided
    if (group_id) {
      entryData.group_id = group_id;
    }

    // TEMPORARY: Mock time entry creation for testing
    const mockTimeEntry = {
      id: `mock_${Date.now()}`,
      user_id: user.id,
      clock_in: entryData.clock_in,
      clock_out: null,
      metadata: entryData.metadata || {},
      group_id: entryData.group_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try database operation but fallback to mock on error
    try {
      const { data: timeEntry, error } = await timeEntries.create(user.id, entryData);

      if (!error && timeEntry) {
        return NextResponse.json({
          entry: timeEntry
        }, { status: 201 });
      }
    } catch (dbError) {
      console.log('Database operation failed, using mock response:', dbError);
    }

    // Store active session for demo
    setActiveSession(mockTimeEntry);

    // Return mock entry if database fails
    return NextResponse.json({
      entry: mockTimeEntry
    }, { status: 201 });

  } catch (error) {
    console.error('Clock in API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}