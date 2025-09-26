/**
 * Marshal Tasks Tool - Core Task Orchestration
 * BuildWorks.AI - Intelligent task management with NLP and automation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { 
  TaskMarshalConfig, 
  MarshalTasksParams, 
  Task, 
  TaskMarshalResponse,
  NotFoundError,
  ValidationError
} from '../types/index.js';

/**
 * Marshal Tasks Tool - Core task orchestration with AI capabilities
 */
export class MarshalTasksTool {
  private _config: TaskMarshalConfig;
  private _logger: winston.Logger;
  private _auditLogger: AuditLog;
  private tasks: Map<string, Task> = new Map();

  constructor(
    config: TaskMarshalConfig,
    logger: winston.Logger,
    auditLogger: AuditLog
  ) {
    this._config = config;
    this._logger = logger.child({ tool: 'marshal_tasks' });
    this._auditLogger = auditLogger;
  }

  /**
   * Get tool definition for MCP
   */
  getToolDefinition(): Tool {
    return {
      name: 'marshal_tasks',
      description: 'Intelligent task management with natural language processing, smart categorization, and automated prioritization. Create, update, assign, and analyze tasks with AI-powered features.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create', 'update', 'assign', 'complete', 'analyze', 'list'],
            description: 'The action to perform on tasks'
          },
          task: {
            type: 'object',
            description: 'Task data for create/update operations',
            properties: {
              title: { type: 'string', description: 'Task title' },
              description: { type: 'string', description: 'Task description' },
              priority: { 
                type: 'string', 
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Task priority level'
              },
              assignee: { type: 'string', description: 'User ID of assignee' },
              dueDate: { type: 'string', format: 'date-time', description: 'Task due date' },
              tags: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Task tags for categorization'
              },
              projectId: { type: 'string', description: 'Associated project ID' },
              dependencies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Task dependency IDs'
              }
            }
          },
          naturalLanguage: {
            type: 'string',
            description: 'Natural language description for AI-powered task creation. Example: "Create a high-priority bug fix task for the authentication module, assign to the security team, due by end of week"'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID for tracking and context'
          },
          filters: {
            type: 'object',
            description: 'Filters for task listing and analysis',
            properties: {
              status: {
                type: 'array',
                items: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'cancelled'] }
              },
              priority: {
                type: 'array',
                items: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
              },
              assignee: { type: 'array', items: { type: 'string' } },
              projectId: { type: 'array', items: { type: 'string' } },
              tags: { type: 'array', items: { type: 'string' } },
              dueDate: {
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' }
                }
              }
            }
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Maximum number of tasks to return'
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Number of tasks to skip'
          }
        },
        required: ['action']
      }
    };
  }

  /**
   * Execute the marshal_tasks tool
   */
  async execute(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    this.logger.info('Executing marshal_tasks', { 
      action: params.action, 
      requestId,
      hasNaturalLanguage: !!params.naturalLanguage 
    });

    try {
      // Validate parameters
      ValidationUtils.validateToolArguments('marshal_tasks', params);

      switch (params.action) {
        case 'create':
          return await this.createTask(params, requestId);
        
        case 'update':
          return await this.updateTask(params, requestId);
        
        case 'assign':
          return await this.assignTask(params, requestId);
        
        case 'complete':
          return await this.completeTask(params, requestId);
        
        case 'analyze':
          return await this.analyzeTasks(params, requestId);
        
        case 'list':
          return await this.listTasks(params, requestId);
        
        default:
          throw new ValidationError(`Invalid action: ${params.action}`);
      }
    } catch (error) {
      this.logger.error('Error executing marshal_tasks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        params,
      });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  private async createTask(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    let taskData: Partial<Task>;

    if (params.naturalLanguage) {
      // Use AI to parse natural language
      taskData = await this.parseNaturalLanguageTask(params.naturalLanguage);
    } else if (params.task) {
      taskData = params.task;
    } else {
      throw new ValidationError('Either task data or natural language input is required');
    }

    // Generate task ID
    const taskId = uuidv4();
    
    // Create task object
    const task: Task = {
      id: taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description,
      priority: taskData.priority || 'medium',
      status: 'pending',
      assignee: taskData.assignee,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: taskData.tags || [],
      projectId: taskData.projectId,
      dependencies: taskData.dependencies || [],
      metadata: {
        createdBy: 'system', // TODO: Get from session
        requestId,
        source: params.naturalLanguage ? 'natural_language' : 'direct',
      },
    };

    // Validate task
    ValidationUtils.validateTask(task);

    // Store task
    this.tasks.set(taskId, task);

    this.logger.info('Task created successfully', { 
      taskId, 
      title: task.title,
      priority: task.priority,
      requestId 
    });

    return {
      success: true,
      data: task,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * Update an existing task
   */
  private async updateTask(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    if (!params.task?.id) {
      throw new ValidationError('Task ID is required for update');
    }

    const existingTask = this.tasks.get(params.task.id);
    if (!existingTask) {
      throw new NotFoundError('Task', params.task.id);
    }

    // Update task fields
    const updatedTask: Task = {
      ...existingTask,
      ...params.task,
      id: existingTask.id, // Preserve ID
      updatedAt: new Date(),
      createdAt: existingTask.createdAt, // Preserve creation date
    };

    // Validate updated task
    ValidationUtils.validateTask(updatedTask);

    // Store updated task
    this.tasks.set(updatedTask.id, updatedTask);

    this.logger.info('Task updated successfully', { 
      taskId: updatedTask.id,
      requestId 
    });

    return {
      success: true,
      data: updatedTask,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * Assign a task to a user
   */
  private async assignTask(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    if (!params.task?.id || !params.task?.assignee) {
      throw new ValidationError('Task ID and assignee are required for assignment');
    }

    const task = this.tasks.get(params.task.id);
    if (!task) {
      throw new NotFoundError('Task', params.task.id);
    }

    // Update assignment
    task.assignee = params.task.assignee;
    task.updatedAt = new Date();
    task.metadata = {
      ...task.metadata,
      assignedBy: 'system', // TODO: Get from session
      assignedAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);

    this.logger.info('Task assigned successfully', { 
      taskId: task.id,
      assignee: task.assignee,
      requestId 
    });

    return {
      success: true,
      data: task,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * Complete a task
   */
  private async completeTask(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    if (!params.task?.id) {
      throw new ValidationError('Task ID is required for completion');
    }

    const task = this.tasks.get(params.task.id);
    if (!task) {
      throw new NotFoundError('Task', params.task.id);
    }

    // Update status to completed
    task.status = 'completed';
    task.updatedAt = new Date();
    task.metadata = {
      ...task.metadata,
      completedBy: 'system', // TODO: Get from session
      completedAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);

    this.logger.info('Task completed successfully', { 
      taskId: task.id,
      requestId 
    });

    return {
      success: true,
      data: task,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * Analyze tasks based on filters
   */
  private async analyzeTasks(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    const tasks = this.filterTasks(params.filters);
    
    const analysis = {
      totalTasks: tasks.length,
      byStatus: this.groupByStatus(tasks),
      byPriority: this.groupByPriority(tasks),
      byAssignee: this.groupByAssignee(tasks),
      overdueTasks: this.getOverdueTasks(tasks),
      upcomingDeadlines: this.getUpcomingDeadlines(tasks),
      averageCompletionTime: this.calculateAverageCompletionTime(tasks),
      recommendations: await this.generateRecommendations(tasks),
    };

    this.logger.info('Task analysis completed', { 
      totalTasks: analysis.totalTasks,
      requestId 
    });

    return {
      success: true,
      data: analysis,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * List tasks with optional filtering and pagination
   */
  private async listTasks(params: MarshalTasksParams, requestId: string): Promise<TaskMarshalResponse> {
    const tasks = this.filterTasks(params.filters);
    
    // Apply pagination
    const { limit, offset } = ValidationUtils.validatePagination(params.limit, params.offset);
    const paginatedTasks = tasks.slice(offset, offset + limit);

    const response = {
      items: paginatedTasks,
      pagination: {
        total: tasks.length,
        limit,
        offset,
        hasMore: offset + limit < tasks.length,
      },
    };

    this.logger.info('Tasks listed successfully', { 
      totalTasks: tasks.length,
      returnedTasks: paginatedTasks.length,
      requestId 
    });

    return {
      success: true,
      data: response,
      metadata: {
        timestamp: new Date(),
        requestId,
        sessionId: params.sessionId,
      },
    };
  }

  /**
   * Parse natural language input to create task
   */
  private async parseNaturalLanguageTask(naturalLanguage: string): Promise<Partial<Task>> {
    // Validate natural language input
    const sanitizedInput = ValidationUtils.validateNaturalLanguage(naturalLanguage);

    // TODO: Integrate with OpenAI API for natural language processing
    // For now, implement basic parsing
    const task: Partial<Task> = {
      title: this.extractTitle(sanitizedInput),
      description: sanitizedInput,
      priority: this.extractPriority(sanitizedInput),
      tags: this.extractTags(sanitizedInput),
    };

    // Extract due date if mentioned
    const dueDate = this.extractDueDate(sanitizedInput);
    if (dueDate) {
      task.dueDate = dueDate;
    }

    // Extract assignee if mentioned
    const assignee = this.extractAssignee(sanitizedInput);
    if (assignee) {
      task.assignee = assignee;
    }

    return task;
  }

  /**
   * Extract title from natural language
   */
  private extractTitle(input: string): string {
    // Simple extraction - take first sentence or first 50 characters
    const sentences = input.split(/[.!?]/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length <= 50) {
      return firstSentence;
    }
    
    return input.substring(0, 50).trim() + (input.length > 50 ? '...' : '');
  }

  /**
   * Extract priority from natural language
   */
  private extractPriority(input: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('critical') || lowerInput.includes('urgent') || lowerInput.includes('asap')) {
      return 'critical';
    }
    
    if (lowerInput.includes('high') || lowerInput.includes('important') || lowerInput.includes('priority')) {
      return 'high';
    }
    
    if (lowerInput.includes('low') || lowerInput.includes('minor')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Extract tags from natural language
   */
  private extractTags(input: string): string[] {
    const tags: string[] = [];
    const lowerInput = input.toLowerCase();
    
    // Common task categories
    const categories = [
      'bug', 'feature', 'documentation', 'testing', 'review', 'deployment',
      'security', 'performance', 'ui', 'backend', 'frontend', 'database'
    ];
    
    categories.forEach(category => {
      if (lowerInput.includes(category)) {
        tags.push(category);
      }
    });
    
    return tags;
  }

  /**
   * Extract due date from natural language
   */
  private extractDueDate(input: string): Date | undefined {
    const lowerInput = input.toLowerCase();
    const now = new Date();
    
    if (lowerInput.includes('today')) {
      return now;
    }
    
    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    if (lowerInput.includes('end of week') || lowerInput.includes('friday')) {
      const friday = new Date(now);
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      friday.setDate(friday.getDate() + daysUntilFriday);
      return friday;
    }
    
    if (lowerInput.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    return undefined;
  }

  /**
   * Extract assignee from natural language
   */
  private extractAssignee(_input: string): string | undefined {
    // TODO: Implement team member name resolution
    // For now, return undefined
    return undefined;
  }

  /**
   * Filter tasks based on criteria
   */
  private filterTasks(filters?: MarshalTasksParams['filters']): Task[] {
    let tasks = Array.from(this.tasks.values());
    
    if (!filters) {
      return tasks;
    }
    
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter(task => filters.status!.includes(task.status));
    }
    
    if (filters.priority && filters.priority.length > 0) {
      tasks = tasks.filter(task => filters.priority!.includes(task.priority));
    }
    
    if (filters.assignee && filters.assignee.length > 0) {
      tasks = tasks.filter(task => task.assignee && filters.assignee!.includes(task.assignee));
    }
    
    if (filters.projectId && filters.projectId.length > 0) {
      tasks = tasks.filter(task => task.projectId && filters.projectId!.includes(task.projectId));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      tasks = tasks.filter(task => 
        filters.tags!.some(tag => task.tags.includes(tag))
      );
    }
    
    if (filters.dueDate) {
      if (filters.dueDate.from) {
        tasks = tasks.filter(task => 
          task.dueDate && task.dueDate >= new Date(filters.dueDate!.from!)
        );
      }
      
      if (filters.dueDate.to) {
        tasks = tasks.filter(task => 
          task.dueDate && task.dueDate <= new Date(filters.dueDate!.to!)
        );
      }
    }
    
    return tasks;
  }

  /**
   * Group tasks by status
   */
  private groupByStatus(tasks: Task[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    tasks.forEach(task => {
      groups[task.status] = (groups[task.status] || 0) + 1;
    });
    
    return groups;
  }

  /**
   * Group tasks by priority
   */
  private groupByPriority(tasks: Task[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    tasks.forEach(task => {
      groups[task.priority] = (groups[task.priority] || 0) + 1;
    });
    
    return groups;
  }

  /**
   * Group tasks by assignee
   */
  private groupByAssignee(tasks: Task[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.assignee) {
        groups[task.assignee] = (groups[task.assignee] || 0) + 1;
      }
    });
    
    return groups;
  }

  /**
   * Get overdue tasks
   */
  private getOverdueTasks(tasks: Task[]): Task[] {
    const now = new Date();
    
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'completed'
    );
  }

  /**
   * Get tasks with upcoming deadlines
   */
  private getUpcomingDeadlines(tasks: Task[]): Task[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate > now && 
      task.dueDate <= nextWeek &&
      task.status !== 'completed'
    );
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
      return sum + completionTime;
    }, 0);
    
    return totalTime / completedTasks.length;
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(tasks: Task[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze overdue tasks
    const overdueTasks = this.getOverdueTasks(tasks);
    if (overdueTasks.length > 0) {
      recommendations.push(`You have ${overdueTasks.length} overdue tasks that need immediate attention.`);
    }
    
    // Analyze high priority tasks
    const highPriorityTasks = tasks.filter(task => 
      task.priority === 'high' || task.priority === 'critical'
    );
    if (highPriorityTasks.length > 5) {
      recommendations.push('Consider delegating some high-priority tasks to balance workload.');
    }
    
    // Analyze unassigned tasks
    const unassignedTasks = tasks.filter(task => !task.assignee);
    if (unassignedTasks.length > 0) {
      recommendations.push(`${unassignedTasks.length} tasks are unassigned and may need attention.`);
    }
    
    return recommendations;
  }
}
