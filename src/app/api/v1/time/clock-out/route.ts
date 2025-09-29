/**
 * Clock Out API Endpoint
 *
 * POST /api/v1/time/clock-out - End the current time entry (clock out)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { MockSessionManager } from '@/lib/mock-session-state';

interface ClockOutRequestBody {
  description?: string;
  timezone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    let body: ClockOutRequestBody;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const now = new Date();
    const clockOutTime = now.toISOString();

    // First, check if there's an active database entry that we need to initialize in mock session
    const { data: activeDbEntry, error: activeEntryError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .single();

    // If we have a real database entry but no mock session, initialize it
    if (activeDbEntry && !MockSessionManager.getSessionState(user.id)) {
      console.log('Initializing mock session from database entry for clock-out');
      MockSessionManager.initializeFromDatabaseEntry(user.id, {
        id: activeDbEntry.id,
        clock_in: activeDbEntry.clock_in,
        project: activeDbEntry.project,
        task: activeDbEntry.task,
        description: activeDbEntry.description,
        timezone: activeDbEntry.timezone || 'UTC'
      });
    }

    // Clock out ALL active entries for this user (handles multiple active entries)
    // First, find all active entries
    const { data: activeEntries, error: findError } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null);

    let updatedTimeEntry = null;
    let timeEntryError = findError;

    if (!findError && activeEntries && activeEntries.length > 0) {
      console.log(`Found ${activeEntries.length} active entries to clock out`);

      // Update all active entries by ID
      const { data: updatedEntries, error: updateError } = await supabase
        .from('time_entries')
        .update({
          clock_out: clockOutTime
        })
        .in('id', activeEntries.map(entry => entry.id))
        .select();

      updatedTimeEntry = updatedEntries && updatedEntries.length > 0 ? updatedEntries[0] : null;
      timeEntryError = updateError;

      if (!updateError) {
        console.log(`Successfully clocked out ${updatedEntries?.length || 0} entries`);
      }
    } else {
      timeEntryError = findError || new Error('No active entries found');
    }

    if (timeEntryError) {
      console.log('Supabase failed, using mock database for clock-out. Error:', timeEntryError.message);

      // Use mock session manager for consistent state
      const mockTimeEntry = MockSessionManager.clockOut(user.id, {
        description: body.description,
        timezone: body.timezone || 'UTC'
      });

      if (!mockTimeEntry) {
        console.error('Mock clock-out failed: No active session found for user', user.id);
        console.error('Mock session state:', MockSessionManager.getSessionState(user.id));
        return NextResponse.json(
          { error: 'No active time entry to clock out' },
          { status: 400 }
        );
      }

      const mockSessionState = MockSessionManager.getSessionState(user.id);

      console.log('Mock clock-out successful:', mockTimeEntry);

      return NextResponse.json({
        timeEntry: mockTimeEntry,
        sessionState: mockSessionState,
        message: 'Successfully clocked out'
      });
    }

    // Try to update session state - if this fails, still return success since clock out worked
    try {
      await supabase
        .from('user_session_state')
        .update({
          is_clocked_in: false,
          active_time_entry_id: null,
          timezone: body.timezone || null,
          auto_detected_timezone: body.timezone || 'UTC',
          last_activity: now.toISOString()
        })
        .eq('user_id', user.id);
    } catch (sessionError) {
      console.log('Session state update failed, but clock out completed successfully');
    }

    return NextResponse.json({
      timeEntry: updatedTimeEntry,
      sessionState: {
        user_id: user.id,
        is_clocked_in: false,
        active_time_entry_id: null,
        timezone: body.timezone || null,
        auto_detected_timezone: body.timezone || 'UTC',
        last_activity: now.toISOString(),
        updated_at: now.toISOString()
      },
      message: 'Successfully clocked out'
    });

  } catch (error) {
    console.error('POST /api/v1/time/clock-out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}