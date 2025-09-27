// T020: Share action tracking API route in src/app/api/v1/groups/invitations/[code]/share/route.ts
// Feature: 006-group-creation-qr

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { InvitationService } from '@/lib/services/InvitationService';
import {
  ShareActionRequest,
  ShareActionResponse,
  ApiErrorResponse
} from '@/lib/types/invitations';

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
        error: 'Unauthorized',
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

    // Parse request body
    let requestBody: ShareActionRequest;
    try {
      const body = await request.text();
      if (!body.trim()) {
        const errorResponse: ApiErrorResponse = {
          error: 'Request body is required',
          code: 'MISSING_REQUEST_BODY'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      requestBody = JSON.parse(body);
    } catch (parseError) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate required fields
    if (!requestBody.share_method) {
      const errorResponse: ApiErrorResponse = {
        error: 'share_method is required',
        code: 'MISSING_SHARE_METHOD'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate share method
    const validShareMethods = ['web_share', 'clipboard', 'email', 'sms', 'whatsapp', 'other'];
    if (!validShareMethods.includes(requestBody.share_method)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid share method. Must be one of: ' + validShareMethods.join(', '),
        code: 'INVALID_SHARE_METHOD'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get invitation to verify it exists and is accessible
    const invitationService = new InvitationService();
    const invitation = await invitationService.getInvitationByCode(invitationCode);

    if (!invitation) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invitation not found or expired',
        code: 'INVITATION_NOT_FOUND'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Record share action
    const { data: shareAction, error: insertError } = await supabase
      .from('invitation_share_actions')
      .insert({
        invitation_id: invitation.id,
        user_id: user.id,
        share_method: requestBody.share_method,
        platform: requestBody.platform || null,
        shared_at: new Date().toISOString(),
        success: requestBody.success ?? true,
        error_message: requestBody.error_message || null,
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to record share action:', insertError);
      const errorResponse: ApiErrorResponse = {
        error: 'Failed to record share action',
        code: 'SHARE_TRACKING_ERROR'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Increment share count on invitation
    await supabase.rpc('increment_invitation_share_count', {
      invitation_id: invitation.id
    });

    const response: ShareActionResponse = {
      success: true,
      share_action_id: shareAction.id,
      invitation_id: invitation.id,
      recorded_at: shareAction.shared_at
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Share action tracking API error:', error);

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