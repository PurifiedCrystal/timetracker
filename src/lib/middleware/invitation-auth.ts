// T031: Add invitation middleware for authentication handling in src/lib/middleware/invitation-auth.ts
// Feature: 006-group-creation-qr

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { InvitationTokenUtils } from '@/lib/utils/invitation-tokens';

export interface InvitationAuthResult {
  success: boolean;
  user?: any;
  invitation?: any;
  error?: string;
  requiresAuth?: boolean;
}

export class InvitationAuthMiddleware {
  static async authenticateInvitationRequest(
    request: NextRequest,
    requireAuth: boolean = true
  ): Promise<InvitationAuthResult> {
    try {
      const supabase = createRouteHandlerClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError && requireAuth) {
        return {
          success: false,
          error: 'Authentication failed',
          requiresAuth: true
        };
      }

      if (!user && requireAuth) {
        return {
          success: false,
          error: 'User not authenticated',
          requiresAuth: true
        };
      }

      return {
        success: true,
        user: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication error occurred',
        requiresAuth: true
      };
    }
  }

  static async validateInvitationToken(token: string): Promise<InvitationAuthResult> {
    try {
      if (!InvitationTokenUtils.isValidTokenFormat(token)) {
        return {
          success: false,
          error: 'Invalid token format'
        };
      }

      const decoded = InvitationTokenUtils.verifyToken(token);
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }

      if (InvitationTokenUtils.isTokenExpired(token)) {
        return {
          success: false,
          error: 'Token has expired'
        };
      }

      return {
        success: true,
        invitation: {
          group_id: decoded.group_id,
          invitation_id: decoded.invitation_id,
          invitation_code: decoded.invitation_code
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token validation failed'
      };
    }
  }

  static async checkGroupManagerPermission(
    groupId: string,
    userId: string
  ): Promise<InvitationAuthResult> {
    try {
      const supabase = createRouteHandlerClient();
      const { data: group, error } = await supabase
        .from('groups')
        .select('manager_id, deleted_at')
        .eq('id', groupId)
        .single();

      if (error || !group) {
        return {
          success: false,
          error: 'Group not found'
        };
      }

      if (group.deleted_at) {
        return {
          success: false,
          error: 'Group has been deleted'
        };
      }

      if (group.manager_id !== userId) {
        return {
          success: false,
          error: 'Insufficient permissions. Only group managers can perform this action.'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Permission check failed'
      };
    }
  }

  static createErrorResponse(
    result: InvitationAuthResult,
    statusCode: number = 400
  ): NextResponse {
    return NextResponse.json(
      {
        error: result.error || 'Authentication failed',
        code: result.requiresAuth ? 'AUTH_REQUIRED' : 'VALIDATION_FAILED'
      },
      { status: statusCode }
    );
  }
}

export default InvitationAuthMiddleware;