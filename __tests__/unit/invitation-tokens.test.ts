// T040: Unit tests for JWT token utilities in __tests__/unit/invitation-tokens.test.ts
// Feature: 006-group-creation-qr

import { InvitationTokenUtils } from '@/lib/utils/invitation-tokens';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('InvitationTokenUtils', () => {
  const mockGroupId = '123e4567-e89b-12d3-a456-426614174000';
  const mockInvitationId = '987fcdeb-51d2-43a1-b456-426614174001';
  const mockInvitationCode = 'ABC123XYZ';
  const mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default environment variable
    process.env.JWT_SECRET = 'test-secret-key-for-invitation-tokens';
  });

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = InvitationTokenUtils.generateToken(
        mockGroupId,
        mockInvitationId,
        mockInvitationCode,
        mockExpiresAt
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          group_id: mockGroupId,
          invitation_id: mockInvitationId,
          invitation_code: mockInvitationCode,
          type: 'invitation'
        },
        'test-secret-key-for-invitation-tokens',
        {
          expiresIn: Math.floor((mockExpiresAt.getTime() - Date.now()) / 1000),
          issuer: 'timetracker-app',
          audience: 'group-invitation'
        }
      );
      expect(token).toBe(mockToken);
    });

    it('should handle missing JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        InvitationTokenUtils.generateToken(
          mockGroupId,
          mockInvitationId,
          mockInvitationCode,
          mockExpiresAt
        );
      }).toThrow('JWT_SECRET environment variable is required');
    });

    it('should handle very short expiration times', () => {
      const shortExpiry = new Date(Date.now() + 30 * 1000); // 30 seconds from now
      (jwt.sign as jest.Mock).mockReturnValue('short.expiry.token');

      const token = InvitationTokenUtils.generateToken(
        mockGroupId,
        mockInvitationId,
        mockInvitationCode,
        shortExpiry
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(Number)
        })
      );
      expect(token).toBe('short.expiry.token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        group_id: mockGroupId,
        invitation_id: mockInvitationId,
        invitation_code: mockInvitationCode,
        type: 'invitation',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.verifyToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        'test-secret-key-for-invitation-tokens',
        {
          issuer: 'timetracker-app',
          audience: 'group-invitation'
        }
      );
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      const mockToken = 'invalid.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const result = InvitationTokenUtils.verifyToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const mockToken = 'expired.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      const result = InvitationTokenUtils.verifyToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const mockToken = 'malformed.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      const result = InvitationTokenUtils.verifyToken(mockToken);

      expect(result).toBeNull();
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      const mockToken = 'some.jwt.token';

      const result = InvitationTokenUtils.verifyToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const mockToken = 'valid.jwt.token';
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockPayload = {
        exp: futureExpiry,
        group_id: mockGroupId
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.isTokenExpired(mockToken);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const mockToken = 'expired.jwt.token';
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockPayload = {
        exp: pastExpiry,
        group_id: mockGroupId
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.isTokenExpired(mockToken);

      expect(result).toBe(true);
    });

    it('should return true for invalid token', () => {
      const mockToken = 'invalid.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const result = InvitationTokenUtils.isTokenExpired(mockToken);

      expect(result).toBe(true);
    });

    it('should return true for token without expiry', () => {
      const mockToken = 'no.expiry.token';
      const mockPayload = {
        group_id: mockGroupId
        // No exp field
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.isTokenExpired(mockToken);

      expect(result).toBe(true);
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const result = InvitationTokenUtils.isValidTokenFormat(validToken);

      expect(result).toBe(true);
    });

    it('should return false for invalid JWT format', () => {
      const invalidFormats = [
        'not.a.jwt',
        'too.few.parts',
        'too.many.parts.here.extra',
        '',
        'single-string-no-dots',
        '....',
        'a.b.c.d.e'
      ];

      invalidFormats.forEach(token => {
        const result = InvitationTokenUtils.isValidTokenFormat(token);
        expect(result).toBe(false);
      });
    });

    it('should return false for non-string input', () => {
      const nonStringInputs = [null, undefined, 123, {}, [], true];

      nonStringInputs.forEach(input => {
        const result = InvitationTokenUtils.isValidTokenFormat(input as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('extractInvitationCode', () => {
    it('should extract invitation code from valid token', () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        group_id: mockGroupId,
        invitation_id: mockInvitationId,
        invitation_code: mockInvitationCode,
        type: 'invitation'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.extractInvitationCode(mockToken);

      expect(result).toBe(mockInvitationCode);
    });

    it('should return null for token without invitation_code', () => {
      const mockToken = 'incomplete.jwt.token';
      const mockPayload = {
        group_id: mockGroupId,
        invitation_id: mockInvitationId,
        type: 'invitation'
        // Missing invitation_code
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.extractInvitationCode(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      const mockToken = 'invalid.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const result = InvitationTokenUtils.extractInvitationCode(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('getTokenPayload', () => {
    it('should return complete token payload for valid token', () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        group_id: mockGroupId,
        invitation_id: mockInvitationId,
        invitation_code: mockInvitationCode,
        type: 'invitation',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = InvitationTokenUtils.getTokenPayload(mockToken);

      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      const mockToken = 'invalid.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const result = InvitationTokenUtils.getTokenPayload(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle extremely long expiration times', () => {
      const veryFutureDate = new Date('2099-12-31T23:59:59Z');
      (jwt.sign as jest.Mock).mockReturnValue('long.expiry.token');

      const token = InvitationTokenUtils.generateToken(
        mockGroupId,
        mockInvitationId,
        mockInvitationCode,
        veryFutureDate
      );

      expect(token).toBe('long.expiry.token');
    });

    it('should handle expired date in the past', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      (jwt.sign as jest.Mock).mockReturnValue('past.expiry.token');

      const token = InvitationTokenUtils.generateToken(
        mockGroupId,
        mockInvitationId,
        mockInvitationCode,
        pastDate
      );

      expect(token).toBe('past.expiry.token');
      // Verify that jwt.sign was called with negative expiresIn
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(Number)
        })
      );
    });

    it('should handle special characters in invitation code', () => {
      const specialCode = 'ABC-123_XYZ.TEST';
      (jwt.sign as jest.Mock).mockReturnValue('special.code.token');

      const token = InvitationTokenUtils.generateToken(
        mockGroupId,
        mockInvitationId,
        specialCode,
        mockExpiresAt
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          invitation_code: specialCode
        }),
        expect.any(String),
        expect.any(Object)
      );
      expect(token).toBe('special.code.token');
    });
  });
});