// T011: Integration test shareable link flow
// Feature: 006-group-creation-qr
// This test covers the complete shareable link creation and sharing flow

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Shareable Link Integration Flow', () => {
  let supabase: any;
  let testGroupId: string;
  let testUserId: string;
  let managerToken: string;

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test data
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'share-test-manager@test.com',
      password: 'testpass123',
      email_confirm: true
    });
    testUserId = user.user.id;

    const { data: group } = await supabase
      .from('groups')
      .insert({
        name: 'Share Test Group',
        manager_id: testUserId,
        description: 'Test group for shareable link flow'
      })
      .select()
      .single();
    testGroupId = group.id;

    // Get auth token
    const { data: session } = await supabase.auth.signInWithPassword({
      email: 'share-test-manager@test.com',
      password: 'testpass123'
    });
    managerToken = session.session.access_token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testGroupId) {
      await supabase.from('groups').delete().eq('id', testGroupId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  it('should complete full shareable link creation and access flow', async () => {
    // Step 1: Create shareable link
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in_hours: 24,
        allow_multiple_uses: true
      })
    });

    // This will fail until shareable link API is implemented
    expect(linkResponse.status).toBe(201);

    const linkData = await linkResponse.json();
    expect(linkData).toMatchObject({
      id: expect.any(String),
      group_id: testGroupId,
      invitation_code: expect.any(String),
      shareable_url: expect.stringContaining('/invite/'),
      expires_at: expect.any(String),
      status: 'pending',
      token: expect.any(String)
    });

    // Step 2: Validate JWT token
    const token = linkData.token;
    expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT format

    // Step 3: Access shareable link
    const invitationCode = linkData.invitation_code;
    const inviteResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`);

    expect(inviteResponse.status).toBe(200);

    const inviteData = await inviteResponse.json();
    expect(inviteData).toMatchObject({
      group_name: 'Share Test Group',
      group_id: testGroupId,
      invitation_valid: true,
      expires_at: expect.any(String)
    });

    // Step 4: Test share action tracking
    const shareResponse = await fetch(`http://localhost:3000/api/v1/groups/invitations/${invitationCode}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        share_method: 'web_share',
        platform: 'WhatsApp'
      })
    });

    expect(shareResponse.status).toBe(201);

    const shareData = await shareResponse.json();
    expect(shareData).toMatchObject({
      share_id: expect.any(String),
      success: true
    });

    // Step 5: Verify database records
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', invitationCode)
      .single();

    expect(invitation).toBeDefined();
    expect(invitation.group_id).toBe(testGroupId);
    expect(invitation.shareable_token).toBe(token);
    expect(invitation.share_count).toBe(1);
  });

  it('should handle multiple share actions correctly', async () => {
    // Create shareable link
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const linkData = await linkResponse.json();
    const invitationCode = linkData.invitation_code;

    // Track multiple share actions
    const shareMethods = ['web_share', 'clipboard', 'email', 'whatsapp'];

    for (const method of shareMethods) {
      const shareResponse = await fetch(`http://localhost:3000/api/v1/groups/invitations/${invitationCode}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          share_method: method,
          platform: method === 'web_share' ? 'WhatsApp' : undefined
        })
      });

      expect(shareResponse.status).toBe(201);
    }

    // Verify share count
    const { data: invitation } = await supabase
      .from('invitations')
      .select('share_count')
      .eq('invitation_code', invitationCode)
      .single();

    expect(invitation.share_count).toBe(shareMethods.length);
  });

  it('should handle link expiration correctly', async () => {
    // Create shareable link with short expiration
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in_hours: 1
      })
    });

    const linkData = await linkResponse.json();
    const invitationCode = linkData.invitation_code;

    // Manually expire the invitation
    await supabase
      .from('invitations')
      .update({
        expires_at: new Date(Date.now() - 1000).toISOString(),
        status: 'expired'
      })
      .eq('invitation_code', invitationCode);

    // Try to access expired link
    const inviteResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`);

    expect(inviteResponse.status).toBe(410);

    const errorData = await inviteResponse.json();
    expect(errorData.error).toContain('expired');
  });

  it('should handle group joining via shareable link', async () => {
    // Create test member user
    const { data: member } = await supabase.auth.admin.createUser({
      email: 'test-member@test.com',
      password: 'testpass123',
      email_confirm: true
    });

    const { data: memberSession } = await supabase.auth.signInWithPassword({
      email: 'test-member@test.com',
      password: 'testpass123'
    });

    const memberToken = memberSession.session.access_token;

    // Create shareable link
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const linkData = await linkResponse.json();
    const invitationCode = linkData.invitation_code;

    // Join group via link
    const joinResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(joinResponse.status).toBe(200);

    const joinData = await joinResponse.json();
    expect(joinData).toMatchObject({
      success: true,
      group_id: testGroupId,
      membership_id: expect.any(String),
      redirect_url: expect.stringContaining('/dashboard/groups/')
    });

    // Verify membership was created
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', testGroupId)
      .eq('user_id', member.user.id)
      .single();

    expect(membership).toBeDefined();
    expect(membership.is_active).toBe(true);

    // Verify invitation status updated
    const { data: invitation } = await supabase
      .from('invitations')
      .select('status, accepted_by, accepted_at')
      .eq('invitation_code', invitationCode)
      .single();

    expect(invitation.status).toBe('accepted');
    expect(invitation.accepted_by).toBe(member.user.id);
    expect(invitation.accepted_at).toBeDefined();

    // Cleanup
    await supabase.auth.admin.deleteUser(member.user.id);
  });

  it('should prevent duplicate group joining', async () => {
    // Create test member user
    const { data: member } = await supabase.auth.admin.createUser({
      email: 'duplicate-test@test.com',
      password: 'testpass123',
      email_confirm: true
    });

    const { data: memberSession } = await supabase.auth.signInWithPassword({
      email: 'duplicate-test@test.com',
      password: 'testpass123'
    });

    const memberToken = memberSession.session.access_token;

    // Create shareable link
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const linkData = await linkResponse.json();
    const invitationCode = linkData.invitation_code;

    // Join group first time
    await fetch(`http://localhost:3000/invite/${invitationCode}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Try to join again
    const secondJoinResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(secondJoinResponse.status).toBe(400);

    const errorData = await secondJoinResponse.json();
    expect(errorData.error).toContain('already a member');

    // Cleanup
    await supabase.auth.admin.deleteUser(member.user.id);
  });

  it('should handle JWT token validation', async () => {
    // Create shareable link
    const linkResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const linkData = await linkResponse.json();
    const invitationCode = linkData.invitation_code;
    const token = linkData.token;

    // Validate token contains expected claims
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

    expect(decodedPayload).toMatchObject({
      group_id: testGroupId,
      invitation_code: invitationCode,
      exp: expect.any(Number),
      iat: expect.any(Number)
    });

    // Verify expiration is in the future
    expect(decodedPayload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});