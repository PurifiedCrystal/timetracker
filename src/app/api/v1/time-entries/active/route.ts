import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { timeEntries } from '@/lib/database';
import { getActiveSession } from '@/lib/mock-session';

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

    let activeEntry = null;

    // First check mock session
    const mockSession = getActiveSession();
    if (mockSession && mockSession.user_id === user.id && !mockSession.clock_out) {
      activeEntry = mockSession;
    }

    // If no mock session, try to get active time entry from database
    if (!activeEntry) {
      try {
        const { data, error } = await timeEntries.getActive(user.id);
        if (!error && data) {
          activeEntry = data;
        }
      } catch (dbError) {
        console.log('Active entry database query failed, using mock data:', dbError);
      }
    }

    // If no active entry, return null
    if (!activeEntry) {
      return NextResponse.json({
        entry: null,
        is_clocked_in: false,
        current_duration: 0
      });
    }

    // Calculate current session duration
    const entryData = activeEntry as any;
    const clockInTime = new Date(entryData.clock_in);
    const currentTime = new Date();
    const currentDuration = Math.floor((currentTime.getTime() - clockInTime.getTime()) / (1000 * 60));

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