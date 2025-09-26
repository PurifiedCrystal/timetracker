import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { timeEntries } from '@/lib/database';
import { clearActiveSession } from '@/lib/mock-session';

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

    // TEMPORARY: Skip database operations, use mock data for testing
    console.log('Clock out requested for entry:', entryId, 'body:', body);

    // Create mock updated entry for clock out
    const mockUpdatedEntry = {
      id: entryId,
      user_id: user.id,
      clock_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      clock_out: body.clock_out || new Date().toISOString(),
      duration_minutes: 120, // 2 hours
      break_minutes: body.break_minutes || 0,
      metadata: {},
      group_id: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Returning mock clocked out entry:', mockUpdatedEntry);

    // Clear the active session when clocking out
    clearActiveSession();

    return NextResponse.json({
      entry: mockUpdatedEntry
    });

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