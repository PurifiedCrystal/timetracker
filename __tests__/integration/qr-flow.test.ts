// T010: Integration test QR code generation flow
// Feature: 006-group-creation-qr
// This test covers the complete QR code generation user flow

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('QR Code Generation Integration Flow', () => {
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
      email: 'qr-test-manager@test.com',
      password: 'testpass123',
      email_confirm: true
    });
    testUserId = user.user.id;

    const { data: group } = await supabase
      .from('groups')
      .insert({
        name: 'QR Test Group',
        manager_id: testUserId,
        description: 'Test group for QR generation flow'
      })
      .select()
      .single();
    testGroupId = group.id;

    // Get auth token
    const { data: session } = await supabase.auth.signInWithPassword({
      email: 'qr-test-manager@test.com',
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

  it('should complete full QR generation and validation flow', async () => {
    // Step 1: Generate QR code
    const qrResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in_hours: 24,
        error_correction_level: 'M'
      })
    });

    // This will fail until QR API is implemented
    expect(qrResponse.status).toBe(201);

    const qrData = await qrResponse.json();
    expect(qrData).toMatchObject({
      id: expect.any(String),
      group_id: testGroupId,
      invitation_code: expect.any(String),
      qr_code_data: expect.stringMatching(/^data:image\/png;base64,/),
      status: 'pending',
      expires_at: expect.any(String),
      invitation_url: expect.stringContaining('/invite/')
    });

    // Step 2: Validate QR code data
    const qrCodeData = qrData.qr_code_data;
    expect(qrCodeData).toMatch(/^data:image\/png;base64,/);

    // QR code should be valid base64
    const base64Data = qrCodeData.split(',')[1];
    expect(() => Buffer.from(base64Data, 'base64')).not.toThrow();

    // Step 3: Test invitation URL access
    const invitationCode = qrData.invitation_code;
    const inviteResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`);

    expect(inviteResponse.status).toBe(200);

    const inviteData = await inviteResponse.json();
    expect(inviteData).toMatchObject({
      group_name: 'QR Test Group',
      group_id: testGroupId,
      invitation_valid: true,
      expires_at: expect.any(String)
    });

    // Step 4: Verify database record
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', invitationCode)
      .single();

    expect(invitation).toBeDefined();
    expect(invitation.group_id).toBe(testGroupId);
    expect(invitation.qr_code_data).toBe(qrCodeData);
    expect(invitation.status).toBe('pending');
  });

  it('should handle QR generation with custom settings', async () => {
    // Test with different error correction level
    const qrResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in_hours: 48,
        error_correction_level: 'H'
      })
    });

    expect(qrResponse.status).toBe(201);

    const qrData = await qrResponse.json();

    // Verify expiration is set correctly
    const expiresAt = new Date(qrData.expires_at);
    const expectedExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
    expect(timeDiff).toBeLessThan(60000); // Within 1 minute tolerance
  });

  it('should track QR code access properly', async () => {
    // Generate QR code
    const qrResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const qrData = await qrResponse.json();
    const invitationCode = qrData.invitation_code;

    // Access invitation multiple times
    await fetch(`http://localhost:3000/invite/${invitationCode}`);
    await fetch(`http://localhost:3000/invite/${invitationCode}`);
    await fetch(`http://localhost:3000/invite/${invitationCode}`);

    // Verify access count is tracked
    const { data: invitation } = await supabase
      .from('invitations')
      .select('access_count')
      .eq('invitation_code', invitationCode)
      .single();

    expect(invitation.access_count).toBe(3);
  });

  it('should handle expired QR codes correctly', async () => {
    // Generate QR code with very short expiration
    const qrResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in_hours: 1
      })
    });

    const qrData = await qrResponse.json();
    const invitationCode = qrData.invitation_code;

    // Manually expire the invitation
    await supabase
      .from('invitations')
      .update({
        expires_at: new Date(Date.now() - 1000).toISOString(),
        status: 'expired'
      })
      .eq('invitation_code', invitationCode);

    // Try to access expired invitation
    const inviteResponse = await fetch(`http://localhost:3000/invite/${invitationCode}`);

    expect(inviteResponse.status).toBe(410);

    const errorData = await inviteResponse.json();
    expect(errorData.error).toContain('expired');
  });

  it('should prevent QR generation for non-managers', async () => {
    // Create non-manager user
    const { data: nonManager } = await supabase.auth.admin.createUser({
      email: 'non-manager@test.com',
      password: 'testpass123',
      email_confirm: true
    });

    const { data: nonManagerSession } = await supabase.auth.signInWithPassword({
      email: 'non-manager@test.com',
      password: 'testpass123'
    });

    const nonManagerToken = nonManagerSession.session.access_token;

    // Try to generate QR code as non-manager
    const qrResponse = await fetch(`http://localhost:3000/api/v1/groups/${testGroupId}/invitations/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nonManagerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(qrResponse.status).toBe(403);

    const errorData = await qrResponse.json();
    expect(errorData.code).toBe('INSUFFICIENT_PERMISSIONS');

    // Cleanup
    await supabase.auth.admin.deleteUser(nonManager.user.id);
  });
});