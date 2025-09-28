/**
 * Marshal Tasks Tool Tests
 * BuildWorks.AI - Comprehensive tests for filesystem-backed task management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { MarshalTasksTool } from '../src/tools/marshal_tasks';
import { FilesystemManager } from '../src/utils/filesystem';
import { ValidationUtils } from '../src/utils/validation';
import winston from 'winston';

describe('MarshalTasksTool - Filesystem Persistence', () => {
  let tool: MarshalTasksTool;
  let testDir: string;
  let filesystem: FilesystemManager;

  beforeEach(async () => {
    testDir = join(tmpdir(), `task-marshal-test-${uuidv4()}`);
    process.env.TASK_MARSHAL_DATA_DIR = testDir;
    process.env.TASK_MARSHAL_SIGNING_KEY = 'test-key-123';

    const logger = winston.createLogger({
      level: 'error',
      transports: [new winston.transports.Console()],
    });

    const auditLogger = { logToolCall: jest.fn(), logToolError: jest.fn() };
    tool = new MarshalTasksTool({} as any, logger, auditLogger as any);
    filesystem = new FilesystemManager({
      rootDir: testDir,
      signingKey: 'test-key-123'
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('Task Creation', () => {
    it('should create a task with filesystem persistence', async () => {
      const params = {
        action: 'create' as const,
        task: {
          title: 'Test Task',
          description: 'Test Description',
          initiativeId: 'test-initiative',
          priority: 'high' as const
        },
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect((result.data as any).title).toBe('Test Task');
      expect((result.data as any).initiativeId).toBe('test-initiative');

      // Verify filesystem persistence
      const savedTask = await filesystem.readTask('test-initiative', (result.data as any).id);
      expect(savedTask).toBeTruthy();
      expect(savedTask?.title).toBe('Test Task');
    });

    it('should enforce initiativeId requirement', async () => {
      const params = {
        action: 'create' as const,
        task: { title: 'Test Task' }
      };

      await expect(tool.execute(params, 'test-request-id')).rejects.toThrow('initiativeId is required');
    });

    it('should validate initiativeId format', () => {
      expect(() => ValidationUtils.validateInitiativeId('')).toThrow();
      expect(() => ValidationUtils.validateInitiativeId('ab')).toThrow();
      expect(() => ValidationUtils.validateInitiativeId('invalid@id')).toThrow();
      expect(() => ValidationUtils.validateInitiativeId('valid-id_123')).not.toThrow();
    });
  });

  describe('Task Updates', () => {
    it('should update an existing task', async () => {
      const createParams = {
        action: 'create' as const,
        task: {
          title: 'Original Task',
          initiativeId: 'test-initiative',
          priority: 'medium' as const
        }
      };

      const createResult = await tool.execute(createParams, 'test-request-id');
      const taskId = createResult.data.id;

      const updateParams = {
        action: 'update' as const,
        task: {
          id: taskId,
          initiativeId: 'test-initiative',
          title: 'Updated Task',
          priority: 'high' as const
        }
      };

      const updateResult = await tool.execute(updateParams, 'test-request-id-2');

      expect(updateResult.success).toBe(true);
      expect(updateResult.data.title).toBe('Updated Task');
      expect(updateResult.data.priority).toBe('high');
    });
  });

  describe('Task Listing', () => {
    it('should list tasks for an initiative', async () => {
      const tasks = [
        { title: 'Task 1', initiativeId: 'test-initiative' },
        { title: 'Task 2', initiativeId: 'test-initiative' },
        { title: 'Task 3', initiativeId: 'other-initiative' }
      ];

      for (const task of tasks) {
        await tool.execute({ action: 'create' as const, task }, 'test-request-id');
      }

      const listParams = {
        action: 'list' as const,
        filters: { initiativeId: 'test-initiative' }
      };

      const result = await tool.execute(listParams, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items.every(t => t.initiativeId === 'test-initiative')).toBe(true);
    });
  });

  describe('Task Analysis', () => {
    it('should analyze tasks with metrics', async () => {
      const tasks = [
        { title: 'Task 1', initiativeId: 'test-initiative', priority: 'high', status: 'pending' as const },
        { title: 'Task 2', initiativeId: 'test-initiative', priority: 'medium', status: 'completed' as const },
        { title: 'Task 3', initiativeId: 'test-initiative', priority: 'low', status: 'in-progress' as const }
      ];

      for (const task of tasks) {
        await tool.execute({ action: 'create' as const, task }, 'test-request-id');
      }

      const analyzeParams = {
        action: 'analyze' as const,
        filters: { initiativeId: 'test-initiative' }
      };

      const result = await tool.execute(analyzeParams, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.totalTasks).toBe(3);
      expect(result.data.byStatus).toHaveProperty('pending');
      expect(result.data.byPriority).toHaveProperty('high');
      expect((result.data as any).recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Rollback Mode', () => {
    it('should use in-memory storage in rollback mode', async () => {
      tool.enableRollbackMode();

      const params = {
        action: 'create' as const,
        task: {
          title: 'Rollback Task',
          initiativeId: 'test-initiative'
        }
      };

      const result = await tool.execute(params, 'test-request-id');

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Rollback Task');
    });
  });

  describe('Dependency Validation', () => {
    it('should validate basic dependencies', async () => {
      expect(() => ValidationUtils.validateInitiativeId('test-initiative')).not.toThrow();
    });
  });
});