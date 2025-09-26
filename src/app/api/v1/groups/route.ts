import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { groups } from '@/lib/database';
import type { CreateGroupRequest } from '@/types/group';

export async function POST(request: NextRequest) {
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

    const body = await request.json() as CreateGroupRequest;

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    if (body.max_members && (body.max_members < 1 || body.max_members > 50)) {
      return NextResponse.json(
        { error: 'Maximum members must be between 1 and 50' },
        { status: 400 }
      );
    }

    const { data: group, error } = await groups.create(user.id, body);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      group,
      message: 'Group created successfully'
    });

  } catch (error) {
    console.error('Create group API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { data: userGroups, error } = await groups.list(user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      groups: userGroups || []
    });

  } catch (error) {
    console.error('Get groups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}