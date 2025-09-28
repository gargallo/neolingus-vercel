// Mock AI Tutor Service for testing
export const mockAITutorService = {
  createSession: jest.fn(),
  sendMessage: jest.fn(),
  endSession: jest.fn(),
  getConversationHistory: jest.fn(),
};

export const createMockContext = () => {
  return {
    req: {},
    json: jest.fn(),
  };
};

export default mockAITutorService;