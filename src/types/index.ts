/**
 * Task-Marshal TypeScript Type Definitions
 * BuildWorks.AI - Production-ready MCP server types
 */

import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignee?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  projectId?: string;
  dependencies?: string[];
  initiativeId?: string;
  parentTaskId?: string;
  subtasks?: any[];
  governanceState?: string;
  visualPriority?: number;
  insightCards?: string[];
  narrativeContext?: string;
  aiSignals?: string[];
  team?: string[];
  milestones?: Milestone[];
  metadata?: Record<string, unknown>;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  tasks: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  workload: number; // 0-100 percentage
  availability: 'available' | 'busy' | 'unavailable';
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// ============================================================================
// Tool Parameters
// ============================================================================

export interface MarshalTasksParams {
  action: 'create' | 'update' | 'assign' | 'complete' | 'analyze' | 'list';
  task?: Partial<Task>;
  naturalLanguage?: string;
  sessionId?: string;
  filters?: TaskFilters;
  limit?: number;
  offset?: number;
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignee?: string[];
  projectId?: string[];
  tags?: string[];
  initiativeId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface MarshalProjectsParams {
  action: 'create' | 'update' | 'analyze' | 'coordinate' | 'list';
  project?: Partial<Project>;
  analysisType?: 'progress' | 'risks' | 'resources' | 'dependencies';
  sessionId?: string;
  filters?: ProjectFilters;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  team: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFilters {
  status?: Project['status'][];
  team?: string[];
  timeline?: {
    from?: Date;
    to?: Date;
  };
}

export interface MarshalWorkflowsParams {
  action: 'create' | 'update' | 'trigger' | 'list' | 'analyze';
  workflow?: Workflow;
  triggerData?: Record<string, unknown>;
  sessionId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'pull_request' | 'task_created' | 'milestone_reached' | 'custom';
  conditions: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'assign_task' | 'send_notification' | 'create_task' | 'update_status' | 'custom';
  parameters: Record<string, unknown>;
  conditions?: Record<string, unknown>;
}

export interface MarshalTeamsParams {
  action: 'create' | 'update' | 'assign' | 'analyze' | 'list';
  team?: Partial<Team>;
  taskId?: string;
  criteria?: string[];
  sessionId?: string;
}

export interface MarshalAnalyticsParams {
  action: 'analyze' | 'report' | 'dashboard';
  analysisType: 'bottlenecks' | 'performance' | 'trends' | 'predictions';
  timeRange?: {
    from: Date;
    to: Date;
  };
  projectId?: string;
  teamId?: string;
  sessionId?: string;
}

export interface MarshalResourcesParams {
  action: 'allocate' | 'analyze' | 'optimize' | 'list';
  resourceType: 'human' | 'time' | 'budget' | 'equipment';
  allocation?: ResourceAllocation;
  sessionId?: string;
}

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  taskId: string;
  amount: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  status: 'allocated' | 'in-use' | 'completed' | 'cancelled';
}

export interface MarshalQualityParams {
  action: 'check' | 'analyze' | 'report' | 'trigger';
  qualityType: 'code' | 'process' | 'deliverable' | 'compliance';
  criteria?: QualityCriteria[];
  sessionId?: string;
}

export interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  threshold: number;
  type: 'numeric' | 'boolean' | 'text';
}

export interface MarshalIntegrationsParams {
  action: 'connect' | 'sync' | 'webhook' | 'list' | 'test';
  integrationType: 'github' | 'slack' | 'jira' | 'custom';
  configuration?: Record<string, unknown>;
  sessionId?: string;
}

export interface MarshalNotificationsParams {
  action: 'send' | 'configure' | 'analyze' | 'list';
  notificationType: 'task_assigned' | 'deadline_approaching' | 'milestone_reached' | 'custom';
  recipients?: string[];
  message?: string;
  sessionId?: string;
}

export interface MarshalAuditParams {
  action: 'log' | 'query' | 'report' | 'analyze';
  eventType?: string;
  userId?: string;
  resourceId?: string;
  timeRange?: {
    from: Date;
    to: Date;
  };
  sessionId?: string;
}

// ============================================================================
// Security & RBAC Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: Permission[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface TaskMarshalResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: Date;
    sessionId?: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface TaskMarshalConfig {
  server: {
    port: number;
    host: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  database: {
    url: string;
    type: 'sqlite' | 'postgresql' | 'mysql';
  };
  security: {
    rbac: {
      enabled: boolean;
      roles: Role[];
    };
    audit: {
      enabled: boolean;
      logLevel: 'minimal' | 'standard' | 'comprehensive';
      retention: string;
    };
    tenantIsolation: {
      enabled: boolean;
      multiTenant: boolean;
    };
  };
  ai: {
    enabled: boolean;
    provider: 'openai' | 'anthropic' | 'custom';
    apiKey?: string;
    model?: string;
  };
  integrations: {
    github?: {
      token: string;
      webhookSecret: string;
    };
    slack?: {
      token: string;
      webhookUrl: string;
    };
    jira?: {
      url: string;
      username: string;
      apiToken: string;
    };
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  assignee: z.string().optional(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()),
  projectId: z.string().uuid().optional(),
  dependencies: z.array(z.string().uuid()),
  metadata: z.record(z.unknown()),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  timeline: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
  team: z.array(z.string()),
  milestones: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    dueDate: z.date(),
    status: z.enum(['pending', 'in-progress', 'completed']),
    tasks: z.array(z.string().uuid()),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.unknown()),
});

export const MarshalTasksParamsSchema = z.object({
  action: z.enum(['create', 'update', 'assign', 'complete', 'analyze', 'list']),
  task: TaskSchema.partial().optional(),
  naturalLanguage: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  filters: z.object({
    status: z.array(z.enum(['pending', 'in-progress', 'completed', 'cancelled'])).optional(),
    priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
    assignee: z.array(z.string()).optional(),
    projectId: z.array(z.string().uuid()).optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
  }).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// ============================================================================
// Error Types
// ============================================================================

export class TaskMarshalError extends Error {
  constructor(
    public _code: string,
    message: string,
    public _details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TaskMarshalError';
  }
}

export class ValidationError extends TaskMarshalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends TaskMarshalError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends TaskMarshalError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends TaskMarshalError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends TaskMarshalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ToolAction<T extends string> = T;

export type ToolResponse<T = unknown> = TaskMarshalResponse<T>;

export type AsyncToolResponse<T = unknown> = Promise<ToolResponse<T>>;
