// Mock auth utilities for testing
export const mockAuth = {
  verifyToken: jest.fn(),
  getCurrentUser: jest.fn(),
};

export const mockUser = {
  id: "user_123",
  email: "test@example.com",
  full_name: "Test User",
};

export default mockAuth;