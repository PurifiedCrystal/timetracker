// T037: Unit tests for QRCodeService in __tests__/unit/QRCodeService.test.ts
// Feature: 006-group-creation-qr

import { QRCodeService } from '@/lib/services/QRCodeService';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { jest } from '@jest/globals';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// Mock QRCode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
  toString: jest.fn()
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
  }))
};

(createServerComponentClient as jest.Mock).mockReturnValue(mockSupabase);

describe('QRCodeService', () => {
  let qrCodeService: QRCodeService;

  beforeEach(() => {
    qrCodeService = new QRCodeService();
    jest.clearAllMocks();
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully for valid group and user', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';

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

      // Mock invitation creation
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          group_id: groupId,
          invitation_code: 'ABC123XYZ',
          qr_code_data: 'data:image/png;base64,mock-qr-data',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        error: null
      });

      // Mock QR code generation
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock-qr-data');

      const result = await qrCodeService.generateQRCode(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.qr_code_url).toBe('data:image/png;base64,mock-qr-data');
      expect(result.invitation_code).toBe('ABC123XYZ');
      expect(result.expires_at).toBeDefined();
    });

    it('should fail when group does not exist', async () => {
      const groupId = 'nonexistent-group';
      const userId = 'user123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Group not found' }
      });

      await expect(qrCodeService.generateQRCode(groupId, userId))
        .rejects.toThrow('Group not found');
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

      await expect(qrCodeService.generateQRCode(groupId, userId))
        .rejects.toThrow('Only group managers can generate QR codes');
    });

    it('should fail when group is soft deleted', async () => {
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

      await expect(qrCodeService.generateQRCode(groupId, userId))
        .rejects.toThrow('Group has been deleted');
    });

    it('should handle custom expiration time', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '987fcdeb-51d2-43a1-b456-426614174000';
      const customExpiresInHours = 48;

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: groupId,
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          group_id: groupId,
          invitation_code: 'ABC123XYZ',
          qr_code_data: 'data:image/png;base64,mock-qr-data',
          expires_at: new Date(Date.now() + customExpiresInHours * 60 * 60 * 1000).toISOString()
        },
        error: null
      });

      const QRCode = require('qrcode');
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock-qr-data');

      const result = await qrCodeService.generateQRCode(groupId, userId, {
        expires_in_hours: customExpiresInHours
      });

      expect(result.success).toBe(true);
      // Verify expiration time is approximately correct (within 1 minute tolerance)
      const expectedExpiry = new Date(Date.now() + customExpiresInHours * 60 * 60 * 1000);
      const actualExpiry = new Date(result.expires_at!);
      const timeDiff = Math.abs(expectedExpiry.getTime() - actualExpiry.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });
  });

  describe('validateQRCode', () => {
    it('should validate QR code successfully', async () => {
      const invitationCode = 'ABC123XYZ';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          group_id: 'group123',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          is_active: true
        },
        error: null
      });

      const result = await qrCodeService.validateQRCode(invitationCode);

      expect(result.valid).toBe(true);
      expect(result.invitation_id).toBe('inv123');
      expect(result.group_id).toBe('group123');
    });

    it('should fail validation for expired QR code', async () => {
      const invitationCode = 'EXPIRED123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          is_active: true
        },
        error: null
      });

      const result = await qrCodeService.validateQRCode(invitationCode);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code has expired');
    });

    it('should fail validation for inactive QR code', async () => {
      const invitationCode = 'INACTIVE123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          is_active: false
        },
        error: null
      });

      const result = await qrCodeService.validateQRCode(invitationCode);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code has been deactivated');
    });

    it('should fail validation for non-existent QR code', async () => {
      const invitationCode = 'NOTFOUND123';

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' }
      });

      const result = await qrCodeService.validateQRCode(invitationCode);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code not found');
    });
  });

  describe('invalidateQRCode', () => {
    it('should invalidate QR code successfully', async () => {
      const invitationCode = 'ABC123XYZ';
      const userId = 'user123';

      // Mock finding the invitation
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'inv123',
          invitation_code: invitationCode,
          group_id: 'group123'
        },
        error: null
      });

      // Mock finding the group to verify permissions
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'group123',
          manager_id: userId,
          deleted_at: null
        },
        error: null
      });

      // Mock the update operation
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: [{ id: 'inv123', is_active: false }],
        error: null
      });

      const result = await qrCodeService.invalidateQRCode(invitationCode, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('QR code invalidated successfully');
    });

    it('should fail when user lacks permission', async () => {
      const invitationCode = 'ABC123XYZ';
      const userId = 'unauthorized-user';

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: 'inv123', group_id: 'group123' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'group123', manager_id: 'different-user' },
          error: null
        });

      await expect(qrCodeService.invalidateQRCode(invitationCode, userId))
        .rejects.toThrow('Only group managers can invalidate QR codes');
    });
  });

  describe('generateInvitationCode', () => {
    it('should generate unique invitation codes', () => {
      const code1 = qrCodeService['generateInvitationCode']();
      const code2 = qrCodeService['generateInvitationCode']();

      expect(code1).toHaveLength(12);
      expect(code2).toHaveLength(12);
      expect(code1).not.toBe(code2);
      expect(/^[A-Z0-9]+$/.test(code1)).toBe(true);
      expect(/^[A-Z0-9]+$/.test(code2)).toBe(true);
    });
  });
});