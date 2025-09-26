import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { invitations, groups } from '@/lib/database';
import type { GenerateQRRequest } from '@/types/invitation';

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

    const body = await request.json() as GenerateQRRequest;

    // Validate required fields
    if (!body.group_id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Validate expires_in_hours if provided
    if (body.expires_in_hours && (body.expires_in_hours < 1 || body.expires_in_hours > 168)) {
      return NextResponse.json(
        { error: 'Expiry hours must be between 1 and 168 (1 week)' },
        { status: 400 }
      );
    }

    // Verify user has access to the group (is manager or member)
    const { data: group, error: groupError } = await groups.get(user.id, body.group_id);
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create invitation
    const { data: qrInvitation, error } = await invitations.create(body.group_id, user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invitation: qrInvitation,
      message: 'QR invitation generated successfully'
    });

  } catch (error) {
    console.error('Generate QR invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}