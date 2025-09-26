/**
 * Unit tests for UserService
 */
import { UserService } from '@/services/UserService';
import { createMockSupabaseClient } from '@/lib/mock-session';

// Mock the database client
jest.mock('@/lib/database', () => ({
  createSupabaseServiceClient: jest.fn(() => createMockSupabaseClient())
}));

// Mock the mock-session module
jest.mock('@/lib/mock-session', () => ({
  createMockSupabaseClient: jest.fn(() => ({
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
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }))
}));

describe('UserService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
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
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    };
  });

  describe('getUserProfile', () => {
    it('should return user profile for valid user ID', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        location_state: 'CA',
        created_at: '2024-01-01T00:00:00.000Z'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: mockUser,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await UserService.getUserProfile('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(mockClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should return error for non-existent user', async () => {
      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found' }
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await UserService.getUserProfile('invalid-user', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await UserService.getUserProfile('test-user-123', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('createUserProfile', () => {
    it('should create new user profile successfully', async () => {
      const newUser = {
        id: 'new-user-123',
        email: 'new@example.com',
        name: 'New User',
        location_state: 'NY'
      };

      const createdUser = {
        ...newUser,
        created_at: '2024-01-01T00:00:00.000Z'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: createdUser,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await UserService.createUserProfile(newUser, mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdUser);
      expect(mockClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should return error for duplicate user creation', async () => {
      const duplicateUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
        location_state: 'CA'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'duplicate key value violates unique constraint' }
        })
      };

      mockClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await UserService.createUserProfile(duplicateUser, mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('duplicate key value violates unique constraint');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        location_state: 'TX'
      };

      const updatedUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        location_state: 'TX',
        created_at: '2024-01-01T00:00:00.000Z'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: updatedUser,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await UserService.updateUserProfile('test-user-123', updates, mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser);
      expect(mockClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should return error for invalid user update', async () => {
      const updates = { name: 'New Name' };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows updated' }
        })
      };

      mockClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await UserService.updateUserProfile('invalid-user', updates, mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No rows updated');
    });
  });

  describe('deleteUserProfile', () => {
    it('should delete user profile successfully', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue(mockChain)
      });

      const result = await UserService.deleteUserProfile('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should return error for failed deletion', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found for deletion' }
        })
      };

      mockClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue(mockChain)
      });

      const result = await UserService.deleteUserProfile('invalid-user', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found for deletion');
    });
  });

  describe('validateUserData', () => {
    it('should validate complete user data', () => {
      const validUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        location_state: 'CA'
      };

      const result = UserService.validateUserData(validUser);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for invalid user data', () => {
      const invalidUser = {
        id: '',
        email: 'invalid-email',
        name: '',
        location_state: 'INVALID'
      };

      const result = UserService.validateUserData(invalidUser);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID is required');
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Invalid location state');
    });

    it('should validate email format correctly', () => {
      const userWithInvalidEmail = {
        id: 'test-user-123',
        email: 'not-an-email',
        name: 'Test User',
        location_state: 'CA'
      };

      const result = UserService.validateUserData(userWithInvalidEmail);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });

  describe('getUsersByState', () => {
    it('should return users filtered by state', async () => {
      const mockUsers = [
        { id: 'user1', name: 'User 1', location_state: 'CA' },
        { id: 'user2', name: 'User 2', location_state: 'CA' }
      ];

      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      });

      const result = await UserService.getUsersByState('CA', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsers);
      expect(result.data?.length).toBe(2);
    });

    it('should return empty array for state with no users', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      });

      const result = await UserService.getUsersByState('AK', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('isCaliforniaUser', () => {
    it('should return true for California users', () => {
      const caUser = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        location_state: 'CA'
      };

      expect(UserService.isCaliforniaUser(caUser)).toBe(true);
    });

    it('should return false for non-California users', () => {
      const nyUser = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        location_state: 'NY'
      };

      expect(UserService.isCaliforniaUser(nyUser)).toBe(false);
    });

    it('should return false for users without location state', () => {
      const userWithoutState = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      expect(UserService.isCaliforniaUser(userWithoutState as any)).toBe(false);
    });
  });
});