import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { GroupService } from '@/lib/services/groupService';
import type { CreateGroupRequest } from '@/lib/types/group.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get authenticated user
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

    if (body.max_members && (body.max_members < 1 || body.max_members > 100)) {
      return NextResponse.json(
        { error: 'Maximum members must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Create group using service
    const group = await GroupService.createGroup(body, user.id);

    return NextResponse.json({
      data: group,
      message: 'Group created successfully'
    });

  } catch (error) {
    console.error('Create group API error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's groups using service
    const userGroups = await GroupService.getUserGroups(user.id);

    return NextResponse.json({
      data: userGroups,
      total: userGroups.length
    });

  } catch (error) {
    console.error('Get groups API error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}