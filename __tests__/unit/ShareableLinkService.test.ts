// T038: Unit tests for ShareableLinkService in __tests__/unit/ShareableLinkService.test.ts
// Feature: 006-group-creation-qr

import { ShareableLinkService } from '@/lib/services/ShareableLinkService';
import { InvitationTokenUtils } from '@/lib/utils/invitation-tokens';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('@/lib/utils/invitation-tokens');
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  })),
  rpc: jest.fn()
};

(createServerComponentClient as jest.Mock).mockReturnValue(mockSupabase);

describe('ShareableLinkService', () => {
  let shareableLinkService: ShareableLinkService;

  beforeEach(() => {
    shareableLinkService = new ShareableLinkService();
    jest.clearAllMocks();
  });

  describe('createShareableLink', () => {
    it('should create shareable link successfully', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';

      // Mock group validation
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Test Group',
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      // Mock invitation creation
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          group_id: groupId,
          invitation_code: 'ABC123XYZ',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          max_uses: 10
        },
        error: null
      });

      // Mock token generation
      (InvitationTokenUtils.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await shareableLinkService.createShareableLink(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.shareable_link).toContain('/invite/ABC123XYZ');
      expect(result.jwt_token).toBe('mock-jwt-token');
      expect(result.invitation_code).toBe('ABC123XYZ');
    });

    it('should fail when user is not group manager', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'unauthorized-user';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: 'different-user',
          deleted_at: null
        },
        error: null
      });

      await expect(shareableLinkService.createShareableLink(groupId, userId))
        .rejects.toThrow('Only group managers can create shareable links');
    });

    it('should handle custom expiration and max uses', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';
      const customOptions = {
        expires_in_hours: 48,
        max_uses: 5
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: groupId, manager_id: userId, deleted_at: null },
        error: null
      });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          group_id: groupId,
          invitation_code: 'ABC123XYZ',
          expires_at: new Date(Date.now() + customOptions.expires_in_hours * 60 * 60 * 1000).toISOString(),
          max_uses: customOptions.max_uses
        },
        error: null
      });

      (InvitationTokenUtils.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await shareableLinkService.createShareableLink(groupId, userId, customOptions);

      expect(result.success).toBe(true);
      expect(result.expires_at).toBeDefined();
      expect(result.max_uses).toBe(customOptions.max_uses);
    });
  });

  describe('processInvitationAccess', () => {
    it('should process invitation access successfully', async () => {
      const invitationCode = 'ABC123XYZ';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          group_id: 'group123',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          is_active: true,
          max_uses: 10,
          current_uses: 3
        },
        error: null
      });

      // Mock group data
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'group123',
          name: 'Test Group',
          deleted_at: null
        },
        error: null
      });

      const result = await shareableLinkService.processInvitationAccess(invitationCode);

      expect(result.group_name).toBe('Test Group');
      expect(result.group_id).toBe('group123');
      expect(result.invitation_valid).toBe(true);
      expect(result.already_member).toBe(false);
      expect(result.requires_auth).toBe(true);
    });

    it('should handle expired invitation', async () => {
      const invitationCode = 'EXPIRED123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // expired
          is_active: true
        },
        error: null
      });

      await expect(shareableLinkService.processInvitationAccess(invitationCode))
        .rejects.toThrow('Invitation not found or expired');
    });

    it('should handle max uses reached', async () => {
      const invitationCode = 'MAXUSED123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          is_active: true,
          max_uses: 5,
          current_uses: 5
        },
        error: null
      });

      await expect(shareableLinkService.processInvitationAccess(invitationCode))
        .rejects.toThrow('Invitation usage limit reached');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const invitationCode = 'ABC123XYZ';
      const userId = 'user123';

      // Mock invitation exists and is valid
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            id: 'inv123',
            invitation_code: invitationCode,
            group_id: 'group123',
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            is_active: true,
            max_uses: 10,
            current_uses: 3
          },
          error: null
        })
        // Mock group exists
        .mockResolvedValueOnce({
          data: {
            id: 'group123',
            name: 'Test Group',
            max_members: 20,
            deleted_at: null
          },
          error: null
        })
        // Mock user not already member
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' } // No rows found
        });

      // Mock membership creation
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'membership123',
          user_id: userId,
          group_id: 'group123',
          role: 'member'
        },
        error: null
      });

      // Mock usage increment
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{ current_uses: 4 }],
        error: null
      });

      const result = await shareableLinkService.acceptInvitation(invitationCode, userId);

      expect(result.success).toBe(true);
      expect(result.group_id).toBe('group123');
      expect(result.group_name).toBe('Test Group');
      expect(result.role).toBe('member');
    });

    it('should fail when user is already a member', async () => {
      const invitationCode = 'ABC123XYZ';
      const userId = 'user123';

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: 'inv123', group_id: 'group123' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'group123', max_members: 20 },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'existing123', user_id: userId },
          error: null
        });

      await expect(shareableLinkService.acceptInvitation(invitationCode, userId))
        .rejects.toThrow('User is already a member of this group');
    });
  });

  describe('trackShareAction', () => {
    it('should track share action successfully', async () => {
      const invitationCode = 'ABC123XYZ';
      const shareData = {
        user_id: 'user123',
        share_method: 'web_share',
        shared_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode
        },
        error: null
      });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'share123',
          invitation_id: 'inv123',
          ...shareData
        },
        error: null
      });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await shareableLinkService.trackShareAction(invitationCode, shareData);

      expect(result.success).toBe(true);
      expect(result.share_action_id).toBe('share123');
    });

    it('should fail when invitation not found', async () => {
      const invitationCode = 'NOTFOUND123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' }
      });

      await expect(shareableLinkService.trackShareAction(invitationCode, {}))
        .rejects.toThrow('Invitation not found');
    });
  });

  describe('generateInvitationCode', () => {
    it('should generate unique invitation codes', () => {
      const code1 = shareableLinkService['generateInvitationCode']();
      const code2 = shareableLinkService['generateInvitationCode']();

      expect(code1).toHaveLength(12);
      expect(code2).toHaveLength(12);
      expect(code1).not.toBe(code2);
      expect(/^[A-Z0-9]+$/.test(code1)).toBe(true);
      expect(/^[A-Z0-9]+$/.test(code2)).toBe(true);
    });
  });
});