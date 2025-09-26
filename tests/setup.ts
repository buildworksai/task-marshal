/**
 * Jest Setup File
 * BuildWorks.AI - Test setup and configuration
 */

// Global test setup
beforeAll(() => {
  // Setup code here
});

afterAll(() => {
  // Cleanup code here
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};