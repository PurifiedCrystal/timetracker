// T017: JWT token utilities for shareable links in src/lib/utils/invitation-tokens.ts
// Feature: 006-group-creation-qr

import jwt from 'jsonwebtoken';
import { InvitationTokenPayload } from '@/lib/types/invitations';

export class InvitationTokenUtils {
  private static jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  /**
   * Generate JWT token for invitation
   */
  static generateToken(
    groupId: string,
    invitationId: string,
    invitationCode: string,
    expiresAt: Date
  ): string {
    const payload: InvitationTokenPayload = {
      group_id: groupId,
      invitation_id: invitationId,
      invitation_code: invitationCode,
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
      type: 'group_invitation'
    };

    return jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256'
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): InvitationTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as InvitationTokenPayload;

      // Additional validation
      if (decoded.type !== 'group_invitation') {
        console.error('Invalid token type:', decoded.type);
        return null;
      }

      // Check if token is expired
      if (decoded.exp <= Math.floor(Date.now() / 1000)) {
        console.error('Token is expired');
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): InvitationTokenPayload | null {
    try {
      const decoded = jwt.decode(token) as InvitationTokenPayload;
      return decoded;
    } catch (error) {
      console.error('Token decoding failed:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return true;
      }

      return decoded.exp <= Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Refresh token (generate new token with extended expiration)
   */
  static refreshToken(
    currentToken: string,
    newExpirationHours: number = 24
  ): string | null {
    try {
      const decoded = this.verifyToken(currentToken);
      if (!decoded) {
        return null;
      }

      const newExpiresAt = new Date(Date.now() + newExpirationHours * 60 * 60 * 1000);

      return this.generateToken(
        decoded.group_id,
        decoded.invitation_id,
        decoded.invitation_code,
        newExpiresAt
      );
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Extract invitation code from token
   */
  static extractInvitationCode(token: string): string | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.invitation_code || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract group ID from token
   */
  static extractGroupId(token: string): string | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.group_id || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate token format (basic JWT structure check)
   */
  static isValidTokenFormat(token: string): boolean {
    if (typeof token !== 'string') {
      return false;
    }

    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if parts are base64url encoded
    try {
      for (const part of parts) {
        if (part.length === 0) {
          return false;
        }
        // Basic base64url check (allow URL-safe characters)
        if (!/^[A-Za-z0-9_-]+$/.test(part)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get token claims without verification
   */
  static getTokenClaims(token: string): Partial<InvitationTokenPayload> | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      return {
        group_id: decoded.group_id,
        invitation_id: decoded.invitation_id,
        invitation_code: decoded.invitation_code,
        exp: decoded.exp,
        iat: decoded.iat,
        type: decoded.type
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate secure random invitation code
   */
  static generateInvitationCode(length: number = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    // Use crypto.getRandomValues for cryptographically secure random
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        code += chars[array[i] % chars.length];
      }
    } else if (typeof require !== 'undefined') {
      // Node.js environment
      const crypto = require('crypto');
      const array = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        code += chars[array[i] % chars.length];
      }
    } else {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return code;
  }

  /**
   * Create short URL code for shareable links
   */
  static generateShortCode(length: number = 8): string {
    // Use URL-safe characters for short codes
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    return this.generateRandomString(chars, length);
  }

  /**
   * Validate invitation code format
   */
  static isValidInvitationCode(code: string): boolean {
    if (typeof code !== 'string') {
      return false;
    }

    // Check length and character set
    const validPattern = /^[a-zA-Z0-9]{8,16}$/;
    return validPattern.test(code);
  }

  /**
   * Generate expiration time based on hours from now
   */
  static getExpirationTime(hoursFromNow: number): Date {
    if (hoursFromNow <= 0 || hoursFromNow > 168) { // Max 1 week
      throw new Error('Expiration hours must be between 1 and 168');
    }

    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }

  /**
   * Format token expiration for display
   */
  static formatTokenExpiration(token: string): string | null {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return null;
      }

      return expiration.toISOString();
    } catch {
      return null;
    }
  }

  // Private helper methods

  private static generateRandomString(chars: string, length: number): string {
    let result = '';

    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else if (typeof require !== 'undefined') {
      const crypto = require('crypto');
      const array = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return result;
  }
}

// Export convenience functions for easier imports
export const {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  refreshToken,
  extractInvitationCode,
  extractGroupId,
  isValidTokenFormat,
  getTokenClaims,
  generateInvitationCode,
  generateShortCode,
  isValidInvitationCode,
  getExpirationTime,
  formatTokenExpiration
} = InvitationTokenUtils;

// Default export
export default InvitationTokenUtils;