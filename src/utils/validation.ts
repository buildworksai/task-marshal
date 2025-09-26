/**
 * Validation Utilities for Task-Marshal
 * BuildWorks.AI - Input validation and data integrity
 */

import { z } from 'zod';
import { 
  MarshalTasksParamsSchema,
  TaskSchema,
  ProjectSchema,
  MarshalTasksParams,
  ValidationError,
  TaskMarshalError 
} from '../types/index.js';

/**
 * Validation utility class for Task-Marshal
 */
export class ValidationUtils {
  /**
   * Validate tool arguments based on tool name
   */
  static async validateToolArguments(toolName: string, args: unknown): Promise<unknown> {
    try {
      switch (toolName) {
        case 'marshal_tasks':
          return MarshalTasksParamsSchema.parse(args);
        
        case 'marshal_projects':
          // TODO: Implement project validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_workflows':
          // TODO: Implement workflow validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_teams':
          // TODO: Implement team validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_analytics':
          // TODO: Implement analytics validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_resources':
          // TODO: Implement resource validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_quality':
          // TODO: Implement quality validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_integrations':
          // TODO: Implement integration validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_notifications':
          // TODO: Implement notification validation schema
          return this.validateBasicObject(args);
        
        case 'marshal_audit':
          // TODO: Implement audit validation schema
          return this.validateBasicObject(args);
        
        default:
          throw new ValidationError(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid arguments', {
          errors: error.errors,
          toolName,
        });
      }
      throw error;
    }
  }

  /**
   * Validate basic object structure
   */
  private static validateBasicObject(obj: unknown): Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null) {
      throw new ValidationError('Arguments must be an object');
    }
    
    return obj as Record<string, unknown>;
  }

  /**
   * Validate task data
   */
  static validateTask(task: unknown): void {
    try {
      TaskSchema.parse(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid task data', {
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Validate project data
   */
  static validateProject(project: unknown): void {
    try {
      ProjectSchema.parse(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid project data', {
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Validate UUID format
   */
  static validateUUID(id: string, fieldName: string = 'id'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      throw new ValidationError(`Invalid ${fieldName} format`, {
        fieldName,
        value: id,
      });
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', {
        email,
      });
    }
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new ValidationError('Start date must be before end date', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }
  }

  /**
   * Validate priority level
   */
  static validatePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const validPriorities = ['low', 'medium', 'high', 'critical'] as const;
    
    if (!validPriorities.includes(priority as any)) {
      throw new ValidationError('Invalid priority level', {
        priority,
        validPriorities,
      });
    }
    
    return priority as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Validate status
   */
  static validateStatus(status: string, validStatuses: readonly string[]): string {
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status', {
        status,
        validStatuses,
      });
    }
    
    return status;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }
    
    // Remove potentially dangerous characters
    const sanitized = input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
    
    if (sanitized.length > maxLength) {
      throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    return sanitized;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
    const validatedLimit = limit ? Math.max(1, Math.min(100, limit)) : 20;
    const validatedOffset = offset ? Math.max(0, offset) : 0;
    
    return {
      limit: validatedLimit,
      offset: validatedOffset,
    };
  }

  /**
   * Validate natural language input
   */
  static validateNaturalLanguage(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Natural language input must be a string');
    }
    
    const sanitized = this.sanitizeString(input, 2000);
    
    if (sanitized.length < 3) {
      throw new ValidationError('Natural language input must be at least 3 characters long');
    }
    
    return sanitized;
  }

  /**
   * Validate session ID
   */
  static validateSessionId(sessionId: string): void {
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }
    
    this.validateUUID(sessionId, 'sessionId');
  }

  /**
   * Validate tenant ID
   */
  static validateTenantId(tenantId: string): void {
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }
    
    this.validateUUID(tenantId, 'tenantId');
  }

  /**
   * Validate user permissions
   */
  static validatePermissions(userPermissions: string[], requiredPermissions: string[]): void {
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      throw new ValidationError('Insufficient permissions', {
        userPermissions,
        requiredPermissions,
        missing: requiredPermissions.filter(p => !userPermissions.includes(p)),
      });
    }
  }

  /**
   * Validate resource access
   */
  static validateResourceAccess(
    resourceTenantId: string,
    userTenantId: string,
    allowCrossTenant: boolean = false
  ): void {
    if (!allowCrossTenant && resourceTenantId !== userTenantId) {
      throw new ValidationError('Access denied: Resource belongs to different tenant', {
        resourceTenantId,
        userTenantId,
      });
    }
  }

  /**
   * Validate rate limiting
   */
  static validateRateLimit(
    requestCount: number,
    timeWindow: number,
    maxRequests: number
  ): void {
    if (requestCount > maxRequests) {
      throw new ValidationError('Rate limit exceeded', {
        requestCount,
        maxRequests,
        timeWindow,
      });
    }
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: Record<string, unknown>): void {
    const requiredFields = ['server', 'database', 'security'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new ValidationError(`Missing required configuration field: ${field}`);
      }
    }
  }

  /**
   * Validate environment variables
   */
  static validateEnvironment(): void {
    const requiredEnvVars = [
      'NODE_ENV',
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new ValidationError('Missing required environment variables', {
        missing: missingVars,
      });
    }
  }
}
