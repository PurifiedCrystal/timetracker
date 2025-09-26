import { NextRequest, NextResponse } from 'next/server';
import { invitations } from '@/lib/database';

interface RouteParams {
  params: {
    code: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { data: invitationInfo, error } = await invitations.get(params.code);

    if (error || !invitationInfo) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const inviteData = invitationInfo as any;
    if (new Date(inviteData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation is still pending
    if (inviteData.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has been ${inviteData.status}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation_info: invitationInfo
    });

  } catch (error) {
    console.error('Get invitation info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}