import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { UserService } from '@/services/UserService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error } = await UserService.getProfile(user.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 500 }
      );
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timezone, location_state, export_preferences } = body;

    const updates: any = {};
    if (timezone !== undefined) updates.timezone = timezone;
    if (location_state !== undefined) updates.location_state = location_state;
    if (export_preferences !== undefined) updates.export_preferences = export_preferences;

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

    // Update profile
    const { data: profile, error } = await UserService.updateProfile(user.id, updates);

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