// T039: Unit tests for GroupDeletionService in __tests__/unit/GroupDeletionService.test.ts
// Feature: 006-group-creation-qr

import { GroupDeletionService } from '@/lib/services/GroupDeletionService';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
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
    update: jest.fn(() => ({
      eq: jest.fn()
    })),
    count: jest.fn(() => ({
      eq: jest.fn()
    }))
  })),
  rpc: jest.fn()
};

(createServerComponentClient as jest.Mock).mockReturnValue(mockSupabase);

describe('GroupDeletionService', () => {
  let groupDeletionService: GroupDeletionService;

  beforeEach(() => {
    groupDeletionService = new GroupDeletionService();
    jest.clearAllMocks();
  });

  describe('previewGroupDeletion', () => {
    it('should generate deletion preview successfully', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';

      // Mock group exists and user is manager
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Test Group',
          manager_id: userId,
          deleted_at: null,
          created_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      // Mock member count
      mockSupabase.from().count().eq.mockResolvedValueOnce({
        count: 5,
        error: null
      });

      // Mock invitation count
      mockSupabase.from().count().eq.mockResolvedValueOnce({
        count: 3,
        error: null
      });

      // Mock time entries count
      mockSupabase.from().count().eq.mockResolvedValueOnce({
        count: 45,
        error: null
      });

      const result = await groupDeletionService.previewGroupDeletion(groupId, userId);

      expect(result.group_id).toBe(groupId);
      expect(result.group_name).toBe('Test Group');
      expect(result.can_delete).toBe(true);
      expect(result.impact_summary.members_affected).toBe(5);
      expect(result.impact_summary.active_invitations).toBe(3);
      expect(result.impact_summary.time_entries).toBe(45);
      expect(result.warnings).toHaveLength(0);
    });

    it('should include warnings for active data', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Active Group',
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      // Mock significant data counts
      mockSupabase.from().count().eq
        .mockResolvedValueOnce({ count: 15, error: null }) // members
        .mockResolvedValueOnce({ count: 8, error: null })  // invitations
        .mockResolvedValueOnce({ count: 120, error: null }); // time entries

      const result = await groupDeletionService.previewGroupDeletion(groupId, userId);

      expect(result.warnings).toContain('This group has 15 members who will lose access');
      expect(result.warnings).toContain('There are 8 active invitations that will be cancelled');
      expect(result.warnings).toContain('120 time entries will be preserved but no longer accessible in group reports');
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

      await expect(groupDeletionService.previewGroupDeletion(groupId, userId))
        .rejects.toThrow('Only group managers can preview group deletion');
    });

    it('should fail when group is already deleted', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: userId,
          deleted_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      await expect(groupDeletionService.previewGroupDeletion(groupId, userId))
        .rejects.toThrow('Group has already been deleted');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully with proper confirmation', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';
      const deletionRequest = {
        confirm_deletion: true,
        reason: 'Group no longer needed',
        notify_members: true
      };

      // Mock group exists and user is manager
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Test Group',
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      // Mock soft delete operation
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{
          id: groupId,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        }],
        error: null
      });

      // Mock cascade operations
      mockSupabase.from().update().eq
        .mockResolvedValueOnce({ data: [], error: null }) // deactivate invitations
        .mockResolvedValueOnce({ data: [], error: null }); // mark memberships as inactive

      const result = await groupDeletionService.deleteGroup(groupId, userId, deletionRequest);

      expect(result.success).toBe(true);
      expect(result.group_id).toBe(groupId);
      expect(result.message).toBe('Group deleted successfully');
      expect(result.deleted_at).toBeDefined();
      expect(result.data_preserved).toBe(true);
    });

    it('should fail when confirmation is missing', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user123';
      const deletionRequest = {
        confirm_deletion: false
      };

      await expect(groupDeletionService.deleteGroup(groupId, userId, deletionRequest))
        .rejects.toThrow('Deletion confirmation is required');
    });

    it('should fail when user is not group manager', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'unauthorized-user';
      const deletionRequest = {
        confirm_deletion: true
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: 'different-user',
          deleted_at: null
        },
        error: null
      });

      await expect(groupDeletionService.deleteGroup(groupId, userId, deletionRequest))
        .rejects.toThrow('Only group managers can delete groups');
    });

    it('should handle already deleted group', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user123';
      const deletionRequest = {
        confirm_deletion: true
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: userId,
          deleted_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      await expect(groupDeletionService.deleteGroup(groupId, userId, deletionRequest))
        .rejects.toThrow('Group has already been deleted');
    });
  });

  describe('restoreGroup', () => {
    it('should restore soft-deleted group successfully', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';

      // Mock group exists and is deleted
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Test Group',
          manager_id: userId,
          deleted_at: '2024-01-01T00:00:00Z',
          deleted_by: userId
        },
        error: null
      });

      // Mock restore operation
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{
          id: groupId,
          deleted_at: null,
          deleted_by: null
        }],
        error: null
      });

      // Mock reactivate memberships
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await groupDeletionService.restoreGroup(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.group_id).toBe(groupId);
      expect(result.message).toBe('Group restored successfully');
      expect(result.restored_at).toBeDefined();
    });

    it('should fail to restore non-deleted group', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      await expect(groupDeletionService.restoreGroup(groupId, userId))
        .rejects.toThrow('Group is not deleted');
    });

    it('should fail when user is not the original deleter', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'different-user';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: 'original-manager',
          deleted_at: '2024-01-01T00:00:00Z',
          deleted_by: 'original-manager'
        },
        error: null
      });

      await expect(groupDeletionService.restoreGroup(groupId, userId))
        .rejects.toThrow('Only the original group manager can restore this group');
    });
  });

  describe('performCascadeCleanup', () => {
    it('should deactivate invitations and memberships during deletion', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock deactivate invitations
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{ is_active: false }],
        error: null
      });

      // Mock mark memberships as inactive
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{ is_active: false }],
        error: null
      });

      await groupDeletionService['performCascadeCleanup'](groupId);

      expect(mockSupabase.from().update().eq).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors gracefully', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock failed invitation cleanup
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      // Should not throw but log error
      await expect(groupDeletionService['performCascadeCleanup'](groupId))
        .resolves.toBeUndefined();
    });
  });

  describe('generateDeletionSummary', () => {
    it('should generate comprehensive deletion summary', async () => {
      const groupData = {
        id: 'group123',
        name: 'Test Group',
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock various count queries
      mockSupabase.from().count().eq
        .mockResolvedValueOnce({ count: 5, error: null })  // members
        .mockResolvedValueOnce({ count: 2, error: null })  // invitations
        .mockResolvedValueOnce({ count: 30, error: null }); // time entries

      const summary = await groupDeletionService['generateDeletionSummary'](groupData);

      expect(summary.members_affected).toBe(5);
      expect(summary.active_invitations).toBe(2);
      expect(summary.time_entries).toBe(30);
      expect(summary.estimated_data_size).toContain('KB');
    });
  });
});