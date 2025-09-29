import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { MockSessionManager } from '@/lib/mock-session-state';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Try to get active time entry from database
    const { data: activeEntries, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out', null)
      .order('created_at', { ascending: false });

    const activeEntry = activeEntries && activeEntries.length > 0 ? activeEntries[0] : null;

    if (activeEntry) {
      console.log('Real database: Active time entry found:', {
        id: activeEntry.id,
        clock_in: activeEntry.clock_in,
        clock_out: activeEntry.clock_out,
        created_at: activeEntry.created_at
      });
    } else {
      console.log('No active time entry found in database, checking mock session');
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active time entry, using mock data:', error.message);

      // Use mock session manager for consistent state
      const mockSessionState = MockSessionManager.getSessionState(userId);
      const mockActiveEntry = MockSessionManager.getActiveTimeEntry(userId);

      if (!mockSessionState || !mockSessionState.is_clocked_in || !mockActiveEntry) {
        console.log('Mock session: No active time entry found');
        return NextResponse.json({
          entry: null,
          is_clocked_in: false,
          current_duration: 0
        });
      }

      const currentDuration = MockSessionManager.getCurrentDuration(userId);
      console.log('Mock session: Active time entry found:', {
        id: mockActiveEntry.id,
        clock_in: mockActiveEntry.clock_in,
        duration_minutes: currentDuration
      });

      return NextResponse.json({
        entry: mockActiveEntry,
        is_clocked_in: true,
        current_duration: currentDuration
      });
    }

    // If no active entry in database, check mock session
    if (!activeEntry) {
      console.log('No active time entry found in database, checking mock session');

      const mockSessionState = MockSessionManager.getSessionState(userId);
      const mockActiveEntry = MockSessionManager.getActiveTimeEntry(userId);

      if (!mockSessionState || !mockSessionState.is_clocked_in || !mockActiveEntry) {
        return NextResponse.json({
          entry: null,
          is_clocked_in: false,
          current_duration: 0
        });
      }

      const currentDuration = MockSessionManager.getCurrentDuration(userId);
      console.log('Mock session: Active time entry found:', {
        id: mockActiveEntry.id,
        clock_in: mockActiveEntry.clock_in,
        duration_minutes: currentDuration
      });

      return NextResponse.json({
        entry: mockActiveEntry,
        is_clocked_in: true,
        current_duration: currentDuration
      });
    }

    // Calculate current session duration for real database entry
    const clockInTime = new Date(activeEntry.clock_in);
    const currentTime = new Date();
    const currentDuration = Math.floor((currentTime.getTime() - clockInTime.getTime()) / (1000 * 60));

    console.log('Real database: Active time entry found:', {
      id: activeEntry.id,
      clock_in: activeEntry.clock_in,
      duration_minutes: currentDuration
    });

    // Initialize mock session from database entry ONLY if no mock session exists
    // This prevents overriding a clocked-out mock session with database state
    const existingMockSession = MockSessionManager.getSessionState(userId);
    if (!existingMockSession) {
      console.log('Initializing mock session from database entry');
      MockSessionManager.initializeFromDatabaseEntry(userId, {
        id: activeEntry.id,
        clock_in: activeEntry.clock_in,
        project: activeEntry.project,
        task: activeEntry.task,
        description: activeEntry.description,
        timezone: activeEntry.timezone || 'UTC'
      });
    } else {
      console.log('Mock session already exists, preserving current state:', {
        is_clocked_in: existingMockSession.is_clocked_in,
        active_entry_id: existingMockSession.active_time_entry_id
      });
    }

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