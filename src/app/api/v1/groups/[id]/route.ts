import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { GroupService } from '@/lib/services/groupService';
import type { UpdateGroupRequest } from '@/lib/types/group.types';

interface RouteParams {
  params: {
    id: string;
  };
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

    const group = await GroupService.getGroupById(params.id, user.id);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: group
    });

  } catch (error) {
    console.error('Get group API error:', error);

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json() as UpdateGroupRequest;

    // Validate max_members if provided
    if (body.max_members && (body.max_members < 1 || body.max_members > 100)) {
      return NextResponse.json(
        { error: 'Maximum members must be between 1 and 100' },
        { status: 400 }
      );
    }

    const group = await GroupService.updateGroup(params.id, body, user.id);

    return NextResponse.json({
      data: group,
      message: 'Group updated successfully'
    });

  } catch (error) {
    console.error('Update group API error:', error);

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Get user from Supabase auth
    const supabase = createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate group ID format
    const groupId = params.id;
    if (!isValidUUID(groupId)) {
      return NextResponse.json(
        { error: 'Invalid group ID format' },
        { status: 400 }
      );
    }

    // Parse request body for deletion confirmation
    let requestBody: any = {};
    try {
      const body = await request.text();
      if (body.trim()) {
        requestBody = JSON.parse(body);
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Require confirmation for deletion
    if (!requestBody.confirm_deletion) {
      return NextResponse.json(
        { error: 'Deletion must be confirmed. Set confirm_deletion to true.' },
        { status: 400 }
      );
    }

    // Delete group using service
    await GroupService.deleteGroup(groupId, user.id);

    return NextResponse.json({
      message: 'Group deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete group API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Group not found')) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Only group managers')) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Only group managers can delete groups.' },
          { status: 403 }
        );
      }

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

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}