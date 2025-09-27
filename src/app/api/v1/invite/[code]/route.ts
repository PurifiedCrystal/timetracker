// T021: Invitation access page API route in src/app/api/v1/invite/[code]/route.ts
// Feature: 006-group-creation-qr

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { InvitationService } from '@/lib/services/InvitationService';
import {
  InvitationAccessResponse,
  InvitationAcceptanceResponse,
  ApiErrorResponse
} from '@/lib/types/invitations';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  try {
    // Validate invitation code format
    const invitationCode = params.code;
    if (!isValidInvitationCode(invitationCode)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid invitation code format',
        code: 'INVALID_INVITATION_CODE'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Process invitation access
    const invitationService = new InvitationService();
    const response: InvitationAccessResponse = await invitationService.processInvitationAccess(
      invitationCode
    );

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Invitation access API error:', error);

    // Handle specific error types
    if (error.message?.includes('Invitation not found or expired')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invitation not found or expired',
        code: 'INVITATION_NOT_FOUND'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Generic server error
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  try {
    // Get user from Supabase auth
    const supabase = createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ApiErrorResponse = {
        error: 'Unauthorized. Please login to join the group.',
        code: 'AUTH_REQUIRED'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Validate invitation code format
    const invitationCode = params.code;
    if (!isValidInvitationCode(invitationCode)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid invitation code format',
        code: 'INVALID_INVITATION_CODE'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Accept invitation
    const invitationService = new InvitationService();
    const response: InvitationAcceptanceResponse = await invitationService.acceptInvitation(
      invitationCode,
      user.id
    );

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Invitation acceptance API error:', error);

    // Handle specific error types
    if (error.message?.includes('Invitation not found or expired')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invitation not found or expired',
        code: 'INVITATION_NOT_FOUND'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (error.message?.includes('already a member')) {
      const errorResponse: ApiErrorResponse = {
        error: 'You are already a member of this group',
        code: 'ALREADY_MEMBER'
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    if (error.message?.includes('member limit')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Group has reached its member limit',
        code: 'GROUP_FULL'
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Generic server error
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to validate invitation code format
function isValidInvitationCode(code: string): boolean {
  if (typeof code !== 'string') {
    return false;
  }
  // Check length and character set (8-16 alphanumeric characters)
  const validPattern = /^[a-zA-Z0-9]{8,16}$/;
  return validPattern.test(code);
}