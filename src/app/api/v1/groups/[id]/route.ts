import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { groups } from '@/lib/database';
import type { UpdateGroupRequest } from '@/types/group';

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

    const { data: group, error } = await groups.get(user.id, params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      group
    });

  } catch (error) {
    console.error('Get group API error:', error);
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
    if (body.max_members && (body.max_members < 1 || body.max_members > 3)) {
      return NextResponse.json(
        { error: 'Maximum members must be between 1 and 3' },
        { status: 400 }
      );
    }

    const { data: group, error } = await groups.update(user.id, params.id, body);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      group,
      message: 'Group updated successfully'
    });

  } catch (error) {
    console.error('Update group API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await groups.delete(user.id, params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Group deleted successfully'
    });

  } catch (error) {
    console.error('Delete group API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}