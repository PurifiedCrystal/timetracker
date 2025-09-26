import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { timeEntries } from '@/lib/database';
import { clearActiveSession, updateTimeEntry } from '@/lib/mock-session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    const entryId = params.id;

    // TEMPORARY: Return mock entry instead of database call
    const mockEntry = {
      id: entryId,
      user_id: user.id,
      clock_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      clock_out: null, // Still active
      duration_minutes: 0,
      break_minutes: 0,
      metadata: {},
      group_id: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json({
      entry: mockEntry
    });

  } catch (error) {
    console.error('Get time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    const body = await request.json();
    const entryId = params.id;

    // Update the time entry in mock storage
    const updatedEntry = updateTimeEntry(entryId, {
      ...body,
      updated_at: new Date().toISOString()
    });

    if (updatedEntry) {
      console.log('Updated time entry:', updatedEntry);

      // Calculate duration if clocking out
      if (body.clock_out && updatedEntry.clock_in) {
        const clockIn = new Date(updatedEntry.clock_in);
        const clockOut = new Date(body.clock_out);
        const durationMs = clockOut.getTime() - clockIn.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));

        updatedEntry.duration_minutes = durationMinutes;
      }

      return NextResponse.json({
        entry: updatedEntry
      });
    } else {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Update time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // For simplicity, just return success since we're using mock data
    const success = true;

    return NextResponse.json({
      success
    });

  } catch (error) {
    console.error('Delete time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}