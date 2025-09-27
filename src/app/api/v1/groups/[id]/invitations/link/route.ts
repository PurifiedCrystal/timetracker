// T019: Shareable link creation API route in src/app/api/v1/groups/[id]/invitations/link/route.ts
// Feature: 006-group-creation-qr

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { ShareableLinkService } from '@/lib/services/ShareableLinkService';
import {
  ShareableLinkRequest,
  ShareableLinkResponse,
  ApiErrorResponse
} from '@/lib/types/invitations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate group ID format
    const groupId = params.id;
    if (!isValidUUID(groupId)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid group ID format',
        code: 'INVALID_GROUP_ID'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse request body
    let requestBody: ShareableLinkRequest = {};
    try {
      const body = await request.text();
      if (body.trim()) {
        requestBody = JSON.parse(body);
      }
    } catch (parseError) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate request parameters
    if (requestBody.expires_in_hours !== undefined) {
      if (requestBody.expires_in_hours < 1 || requestBody.expires_in_hours > 168) {
        const errorResponse: ApiErrorResponse = {
          error: 'expires_in_hours must be between 1 and 168',
          code: 'INVALID_EXPIRATION'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    if (requestBody.max_uses !== undefined) {
      if (requestBody.max_uses < 1 || requestBody.max_uses > 100) {
        const errorResponse: ApiErrorResponse = {
          error: 'max_uses must be between 1 and 100',
          code: 'INVALID_MAX_USES'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // Create shareable link using service
    const shareableLinkService = new ShareableLinkService();
    const response: ShareableLinkResponse = await shareableLinkService.createShareableLink(
      groupId,
      user.id,
      requestBody
    );

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Shareable link creation API error:', error);

    // Handle specific error types
    if (error.message?.includes('Group not found')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Group not found',
        code: 'GROUP_NOT_FOUND'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (error.message?.includes('Only group managers')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Insufficient permissions. Only group managers can create shareable links.',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    if (error.message?.includes('Group has been deleted')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Group has been deleted',
        code: 'GROUP_DELETED'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (error.message?.includes('Failed to create shareable link')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Failed to create shareable link',
        code: 'LINK_CREATION_ERROR',
        details: { reason: 'Link generation failed' }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Generic server error
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}