import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { userProfiles } from '@/lib/database';

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

    // Get user profile from database
    const { data: profile, error } = await userProfiles.get(user.id);

    if (error) {
      console.error('Profile fetch error:', error);
      // If it's a "no rows" error, treat as profile not found (continue to create)
      if (error.includes('Cannot coerce the result') || error.includes('no rows') || error.includes('not found')) {
        // Continue to create profile below
      } else {
        return NextResponse.json(
          { error: 'Failed to load profile' },
          { status: 500 }
        );
      }
    }

    // If no profile exists or couldn't be fetched due to RLS, return mock profile for testing
    if (!profile) {
      // TEMPORARY: Return mock profile data for testing instead of creating
      const mockProfile = {
        id: 'dc4b7422-67ac-4df6-8808-9040ca899e7c',
        user_id: user.id,
        email: user.email || '',
        full_name: 'Demo User',
        california_mode: false,
        tracking_mode: 'work',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json({
        profile: mockProfile
      });
    }

    return NextResponse.json({
      profile
    });

  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const {
      full_name,
      timezone,
      location_state,
      export_preferences,
      california_mode,
      tracking_mode
    } = body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (timezone !== undefined) updates.timezone = timezone;
    if (location_state !== undefined) updates.location_state = location_state;
    if (export_preferences !== undefined) updates.export_preferences = export_preferences;
    if (california_mode !== undefined) updates.california_mode = california_mode;
    if (tracking_mode !== undefined) updates.tracking_mode = tracking_mode;

    // Validate timezone if provided
    if (timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        return NextResponse.json(
          { error: 'Invalid timezone' },
          { status: 400 }
        );
      }
    }

    // Validate state code if provided
    if (location_state && location_state.length !== 2) {
      return NextResponse.json(
        { error: 'Location state must be a 2-character state code' },
        { status: 400 }
      );
    }

    // Validate tracking mode if provided
    if (tracking_mode && !['work', 'habits'].includes(tracking_mode)) {
      return NextResponse.json(
        { error: 'Tracking mode must be either "work" or "habits"' },
        { status: 400 }
      );
    }

    // Update profile in database
    const { data: profile, error } = await userProfiles.update(user.id, updates);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      profile
    });

  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}