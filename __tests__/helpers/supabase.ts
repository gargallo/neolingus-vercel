// Mock Supabase client for testing
export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

export const createMockSupabaseClient = () => {
  return mockSupabase;
};

export default mockSupabase;