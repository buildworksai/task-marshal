/**
 * Jest Test Setup
 * BuildWorks.AI - Test configuration and global setup
 */

import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'sqlite:./data/test.db';
process.env.RBAC_ENABLED = 'true';
process.env.AUDIT_ENABLED = 'true';
process.env.TENANT_ISOLATION_ENABLED = 'true';
process.env.AI_ENABLED = 'false';
process.env.JWT_SECRET = 'test-secret-key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({})),
}));

// Mock external dependencies
jest.mock('sqlite3', () => ({
  Database: jest.fn(),
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn(),
}));

// Global test utilities
global.testUtils = {
  createMockTask: () => ({
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium',
    status: 'pending',
    assignee: 'test-user',
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['test'],
    projectId: 'test-project',
    dependencies: [],
    metadata: {},
  }),
  
  createMockProject: () => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Project Description',
    status: 'active',
    timeline: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    team: ['test-user'],
    milestones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  }),
  
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@buildworks.ai',
    name: 'Test User',
    roles: ['developer'],
    permissions: ['task:read', 'task:write'],
    tenantId: 'test-tenant',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
