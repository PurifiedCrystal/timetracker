// T012: Integration test group deletion flow
// Feature: 006-group-creation-qr
// This test covers the complete group deletion flow with data preservation

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Group Deletion Integration Flow', () => {
  let supabase: any;
  let testGroupId: string;
  let testUserId: string;
  let managerToken: string;
  let memberIds: string[] = [];

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test manager
    const { data: manager } = await supabase.auth.admin.createUser({
      email: 'deletion-manager@test.com',
      password: 'testpass123',
      email_confirm: true
    });
    testUserId = manager.user.id;

    // Create test group
    const { data: group } = await supabase
      .from('groups')
      .insert({
        name: 'Deletion Test Group',
        manager_id: testUserId,
        description: 'Test group for deletion flow'
      })
      .select()
      .single();
    testGroupId = group.id;

    // Create test members
    for (let i = 1; i <= 3; i++) {
      const { data: member } = await supabase.auth.admin.createUser({
        email: `deletion-member${i}@test.com`,
        password: 'testpass123',
        email_confirm: true
      });
      memberIds.push(member.user.id);

      // Add to group
      await supabase.from('group_memberships').insert({
        group_id: testGroupId,
        user_id: member.user.id,
        is_active: true
      });
    }

    // Create test time entries
    for (let i = 0; i < 5; i++) {
      await supabase.from('time_entries').insert({
        user_id: testUserId,
        group_id: testGroupId,
        start_time: new Date(Date.now() - (i + 1) * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        description: `Test entry ${i + 1}`
      });
    }

    // Get auth token
    const { data: session } = await supabase.auth.signInWithPassword({
      email: 'deletion-manager@test.com',
      password: 'testpass123'
    });
    managerToken = session.session.access_token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testGroupId) {
      // Force delete (not soft delete) for cleanup
      await supabase.from('time_entries').delete().eq('group_id', testGroupId);
      await supabase.from('group_memberships').delete().eq('group_id', testGroupId);
      await supabase.from('groups').delete().eq('id', testGroupId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
    for (const memberId of memberIds) {
      await supabase.auth.admin.deleteUser(memberId);
    }
  });

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  it('should get deletion preview with accurate impact summary', async () => {
    // Get deletion preview
    const previewResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/deletion-preview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      }
    });

    // This will fail until deletion preview API is implemented
    expect(previewResponse.status).toBe(200);

    const previewData = await previewResponse.json();
    expect(previewData).toMatchObject({
      can_delete: true,
      impact_summary: {
        members_affected: 3,
        time_entries_preserved: 5,
        pending_invitations: expect.any(Number),
        active_sessions: 0,
        qr_codes_active: expect.any(Number),
        shareable_links_active: expect.any(Number)
      },
      blockers: [],
      warnings: expect.arrayContaining([
        expect.objectContaining({
          type: 'member_impact',
          message: expect.stringContaining('team members will lose access')
        }),
        expect.objectContaining({
          type: 'data_loss',
          message: expect.stringContaining('configurations will be permanently lost')
        })
      ])
    });
  });

  it('should prevent deletion without confirmation', async () => {
    // Try to delete without confirmation
    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: false,
        reason: 'Testing deletion flow'
      })
    });

    expect(deleteResponse.status).toBe(400);

    const errorData = await deleteResponse.json();
    expect(errorData).toMatchObject({
      error: 'confirm_deletion must be true to delete group',
      code: 'DELETION_NOT_CONFIRMED'
    });
  });

  it('should complete full group deletion flow with data preservation', async () => {
    // Create pending invitations to test cleanup
    const { data: invitation } = await supabase
      .from('invitations')
      .insert({
        group_id: testGroupId,
        invited_by: testUserId,
        invitation_code: 'test-delete-code',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    // Step 1: Get current counts before deletion
    const { count: memberCount } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact' })
      .eq('group_id', testGroupId)
      .eq('is_active', true);

    const { count: timeEntryCount } = await supabase
      .from('time_entries')
      .select('*', { count: 'exact' })
      .eq('group_id', testGroupId);

    // Step 2: Execute deletion
    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Test group deletion',
        preserve_time_entries: true,
        notify_members: true
      })
    });

    expect(deleteResponse.status).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData).toMatchObject({
      success: true,
      group_id: testGroupId,
      deleted_at: expect.any(String),
      members_notified: memberCount,
      time_entries_preserved: timeEntryCount,
      cleanup_summary: {
        memberships_deactivated: memberCount,
        invitations_revoked: expect.any(Number),
        qr_codes_invalidated: expect.any(Number),
        shareable_links_revoked: expect.any(Number)
      }
    });

    // Step 3: Verify soft delete - group should have deleted_at timestamp
    const { data: deletedGroup } = await supabase
      .from('groups')
      .select('deleted_at')
      .eq('id', testGroupId)
      .single();

    expect(deletedGroup.deleted_at).toBeDefined();
    expect(new Date(deletedGroup.deleted_at)).toBeInstanceOf(Date);

    // Step 4: Verify time entries are preserved
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('group_id', testGroupId);

    expect(timeEntries).toHaveLength(5);
    timeEntries.forEach(entry => {
      expect(entry.group_id).toBe(testGroupId);
      expect(entry.description).toContain('Test entry');
    });

    // Step 5: Verify memberships are deactivated
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('is_active')
      .eq('group_id', testGroupId);

    memberships.forEach(membership => {
      expect(membership.is_active).toBe(false);
    });

    // Step 6: Verify pending invitations are revoked
    const { data: revokedInvitation } = await supabase
      .from('invitations')
      .select('status')
      .eq('id', invitation.id)
      .single();

    expect(revokedInvitation.status).toBe('revoked');
  });

  it('should prevent deletion with active time tracking sessions', async () => {
    // Create active time tracking session
    const activeEntry = await supabase.from('time_entries').insert({
      user_id: testUserId,
      group_id: testGroupId,
      start_time: new Date().toISOString(),
      description: 'Active session'
      // No end_time = active session
    }).select().single();

    // Try to delete group with active session
    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Testing with active session'
      })
    });

    expect(deleteResponse.status).toBe(400);

    const errorData = await deleteResponse.json();
    expect(errorData).toMatchObject({
      error: 'Cannot delete group with active time tracking sessions',
      code: 'ACTIVE_SESSIONS_EXIST',
      details: {
        active_sessions: expect.any(Number),
        session_users: expect.arrayContaining([testUserId])
      }
    });

    // Cleanup - end the active session
    await supabase
      .from('time_entries')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeEntry.data.id);
  });

  it('should prevent deletion by non-managers', async () => {
    // Try to delete as non-manager (first member)
    const { data: memberSession } = await supabase.auth.signInWithPassword({
      email: 'deletion-member1@test.com',
      password: 'testpass123'
    });

    const memberToken = memberSession.session.access_token;

    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Unauthorized deletion attempt'
      })
    });

    expect(deleteResponse.status).toBe(403);

    const errorData = await deleteResponse.json();
    expect(errorData).toMatchObject({
      error: 'Only group managers can delete groups',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  });

  it('should handle deletion of non-existent group', async () => {
    const nonExistentGroupId = '999e9999-e99b-99d9-a999-999999999999';

    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${nonExistentGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Testing non-existent group'
      })
    });

    expect(deleteResponse.status).toBe(404);

    const errorData = await deleteResponse.json();
    expect(errorData).toMatchObject({
      error: 'Group not found',
      code: 'GROUP_NOT_FOUND'
    });
  });

  it('should prevent access to deleted group', async () => {
    // First, delete the group
    await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Testing access prevention'
      })
    });

    // Try to access deleted group
    const accessResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(accessResponse.status).toBe(404);

    const errorData = await accessResponse.json();
    expect(errorData.error).toContain('Group not found');
  });

  it('should handle already deleted group gracefully', async () => {
    // Try to delete an already deleted group
    const deleteResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirm_deletion: true,
        reason: 'Testing double deletion'
      })
    });

    expect(deleteResponse.status).toBe(404);

    const errorData = await deleteResponse.json();
    expect(errorData).toMatchObject({
      error: 'Group has already been deleted',
      code: 'GROUP_ALREADY_DELETED',
      details: {
        deleted_at: expect.any(String)
      }
    });
  });
});