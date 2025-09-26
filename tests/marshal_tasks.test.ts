/**
 * Marshal Tasks Tool Tests
 * BuildWorks.AI - Unit tests for marshal_tasks functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MarshalTasksTool } from '../src/tools/marshal_tasks.js';
import { TaskMarshalConfig } from '../src/types/index.js';

// Mock dependencies
const mockLogger = {
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
};

const mockAuditLogger = {
  logToolCall: jest.fn(),
  logToolError: jest.fn(),
};

const mockConfig: TaskMarshalConfig = {
  server: {
    port: 3000,
    host: 'localhost',
    logLevel: 'info',
  },
  database: {
    url: 'sqlite:./data/test.db',
    type: 'sqlite',
  },
  security: {
    rbac: {
      enabled: true,
      roles: [],
    },
    audit: {
      enabled: true,
      logLevel: 'standard',
      retention: '90d',
    },
    tenantIsolation: {
      enabled: true,
      multiTenant: true,
    },
  },
  ai: {
    enabled: false,
    provider: 'openai',
  },
  integrations: {},
};

describe('MarshalTasksTool', () => {
  let tool: MarshalTasksTool;

  beforeEach(() => {
    tool = new MarshalTasksTool(mockConfig, mockLogger, mockAuditLogger);
    jest.clearAllMocks();
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition.name).toBe('marshal_tasks');
      expect(definition.description).toContain('Intelligent task management');
      expect(definition.inputSchema.type).toBe('object');
      expect(definition.inputSchema.properties.action.enum).toContain('create');
    });
  });

  describe('createTask', () => {
    it('should create a task with basic data', async () => {
      const params = {
        action: 'create' as const,
        task: {
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high' as const,
        },
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('title', 'Test Task');
      expect(result.data).toHaveProperty('priority', 'high');
      expect(result.data).toHaveProperty('status', 'pending');
    });

    it('should create a task with natural language input', async () => {
      const params = {
        action: 'create' as const,
        naturalLanguage: 'Create a high-priority bug fix task for the authentication module',
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('priority', 'high');
    });

    it('should throw error when no task data provided', async () => {
      const params = {
        action: 'create' as const,
      };

      await expect(tool.execute(params, 'test-request-id')).rejects.toThrow();
    });
  });

  describe('listTasks', () => {
    it('should list tasks with default pagination', async () => {
      // First create a task
      await tool.execute({
        action: 'create',
        task: { title: 'Test Task 1' },
      }, 'test-request-id');

      const params = {
        action: 'list' as const,
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items');
      expect(result.data).toHaveProperty('pagination');
      expect(Array.isArray(result.data.items)).toBe(true);
    });

    it('should filter tasks by status', async () => {
      // Create a completed task
      const createResult = await tool.execute({
        action: 'create',
        task: { title: 'Test Task', status: 'completed' },
      }, 'test-request-id');

      // Update the task to completed
      await tool.execute({
        action: 'update',
        task: { id: createResult.data.id, status: 'completed' },
      }, 'test-request-id');

      const params = {
        action: 'list' as const,
        filters: {
          status: ['completed'],
        },
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.items.every((task: any) => task.status === 'completed')).toBe(true);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      // Create a task first
      const createResult = await tool.execute({
        action: 'create',
        task: { title: 'Original Title' },
      }, 'test-request-id');

      const taskId = createResult.data.id;

      const params = {
        action: 'update' as const,
        task: {
          id: taskId,
          title: 'Updated Title',
          priority: 'critical' as const,
        },
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(result.data.priority).toBe('critical');
    });

    it('should throw error when updating non-existent task', async () => {
      const params = {
        action: 'update' as const,
        task: {
          id: 'non-existent-id',
          title: 'Updated Title',
        },
      };

      await expect(tool.execute(params, 'test-request-id')).rejects.toThrow();
    });
  });

  describe('completeTask', () => {
    it('should mark a task as completed', async () => {
      // Create a task first
      const createResult = await tool.execute({
        action: 'create',
        task: { title: 'Task to Complete' },
      }, 'test-request-id');

      const taskId = createResult.data.id;

      const params = {
        action: 'complete' as const,
        task: { id: taskId },
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
    });
  });

  describe('analyzeTasks', () => {
    it('should provide task analytics', async () => {
      // Create some test tasks
      await tool.execute({
        action: 'create',
        task: { title: 'Task 1', priority: 'high' },
      }, 'test-request-id');

      await tool.execute({
        action: 'create',
        task: { title: 'Task 2', priority: 'low' },
      }, 'test-request-id');

      const params = {
        action: 'analyze' as const,
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalTasks');
      expect(result.data).toHaveProperty('byStatus');
      expect(result.data).toHaveProperty('byPriority');
      expect(result.data).toHaveProperty('recommendations');
    });
  });

  describe('error handling', () => {
    it('should handle invalid action', async () => {
      const params = {
        action: 'invalid' as any,
      };

      await expect(tool.execute(params, 'test-request-id')).rejects.toThrow();
    });

    it('should handle malformed parameters', async () => {
      const params = {
        action: 'create',
        task: {
          title: '', // Empty title should fail validation
        },
      };

      await expect(tool.execute(params, 'test-request-id')).rejects.toThrow();
    });
  });
});
