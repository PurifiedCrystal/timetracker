import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { GroupService } from '@/services/GroupService';

interface RouteParams {
  params: {
    id: string;
    memberId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is manager of this group
    const { data: group } = await GroupService.getGroup(params.id);
    if (!group || group.manager_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group managers can remove members' },
        { status: 403 }
      );
    }

    // Find the membership to get the user_id
    const membership = group.memberships?.find(m => m.id === params.memberId);
    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Don't allow manager to remove themselves
    if (membership.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Group manager cannot remove themselves' },
        { status: 400 }
      );
    }

    const { error } = await GroupService.removeMember(params.id, membership.user_id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}