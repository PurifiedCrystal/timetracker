import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { groups, groupMemberships } from '@/lib/database';
import type { AddMemberRequest } from '@/types/group';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify user is manager of this group
    const { data: group } = await groups.get(user.id, params.id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is manager
    const groupData = group as any;
    const userMembership = Array.isArray(groupData.group_memberships) ? groupData.group_memberships[0] : null;
    const isManager = userMembership?.role === 'manager';
    if (!isManager) {
      return NextResponse.json(
        { error: 'Only group managers can add members' },
        { status: 403 }
      );
    }

    const body = await request.json() as AddMemberRequest;

    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: membership, error } = await groupMemberships.add(
      params.id,
      body.user_id,
      body.role || 'member'
    );

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      membership,
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Add member API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Verify user has access to this group (is manager or member)
    const { data: group } = await groups.get(user.id, params.id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    const { data: members, error } = await groupMemberships.list(params.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      members
    });

  } catch (error) {
    console.error('Get members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}