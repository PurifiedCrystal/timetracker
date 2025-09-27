// T023: Group deletion preview API route in src/app/api/v1/groups/[id]/deletion-preview/route.ts
// Feature: 006-group-creation-qr

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { GroupDeletionService } from '@/lib/services/GroupDeletionService';
import {
  GroupDeletionPreviewResponse,
  ApiErrorResponse
} from '@/lib/types/invitations';

export async function GET(
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

    // Generate deletion preview using service
    const groupDeletionService = new GroupDeletionService();
    const response: GroupDeletionPreviewResponse = await groupDeletionService.previewGroupDeletion(
      groupId,
      user.id
    );

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Group deletion preview API error:', error);

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
        error: 'Insufficient permissions. Only group managers can preview group deletion.',
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