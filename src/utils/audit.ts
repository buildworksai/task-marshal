/**
 * Audit Logger for Task-Marshal
 * BuildWorks.AI - Comprehensive audit logging and compliance tracking
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { TaskMarshalConfig, AuditLog, TaskMarshalError } from '../types/index.js';

/**
 * Audit Logger class for Task-Marshal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class AuditLogger {
  private logger: winston.Logger;
  private config: TaskMarshalConfig;
  private auditLogs: AuditLog[] = [];

  constructor(config: TaskMarshalConfig, mainLogger: winston.Logger) {
    this.config = config;
    this.logger = mainLogger.child({ component: 'audit' });
    
    // Setup audit-specific logger
    this.setupAuditLogger();
  }

  /**
   * Setup audit-specific logger
   */
  private setupAuditLogger(): void {
    if (this.config.security.audit.enabled) {
      const auditTransport = new winston.transports.File({
        filename: 'logs/audit.log',
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      });

      this.logger.add(auditTransport);
    }
  }

  /**
   * Log tool call
   */
  async logToolCall(
    toolName: string,
    arguments_: Record<string, unknown>,
    result: unknown,
    requestId: string,
    duration: number
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId: this.extractUserId(arguments_),
      tenantId: this.extractTenantId(arguments_),
      action: `tool_call:${toolName}`,
      resource: 'mcp_tool',
      resourceId: toolName,
      timestamp: new Date(),
      metadata: {
        toolName,
        arguments: this.sanitizeArguments(arguments_),
        result: this.sanitizeResult(result),
        requestId,
        duration,
        success: true,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log tool error
   */
  async logToolError(
    toolName: string,
    arguments_: Record<string, unknown>,
    error: unknown,
    requestId: string,
    duration: number
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId: this.extractUserId(arguments_),
      tenantId: this.extractTenantId(arguments_),
      action: `tool_error:${toolName}`,
      resource: 'mcp_tool',
      resourceId: toolName,
      timestamp: new Date(),
      metadata: {
        toolName,
        arguments: this.sanitizeArguments(arguments_),
        error: this.sanitizeError(error),
        requestId,
        duration,
        success: false,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    tenantId: string,
    action: 'login' | 'logout' | 'token_refresh' | 'password_change',
    success: boolean,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      tenantId,
      action: `auth:${action}`,
      resource: 'user',
      resourceId: userId,
      timestamp: new Date(),
      metadata: {
        action,
        success,
        ...metadata,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    userId: string,
    tenantId: string,
    action: string,
    resource: string,
    resourceId: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      tenantId,
      action: `authz:${action}`,
      resource,
      resourceId,
      timestamp: new Date(),
      metadata: {
        action,
        success,
        reason,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    tenantId: string,
    action: 'read' | 'write' | 'delete',
    resource: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      tenantId,
      action: `data:${action}`,
      resource,
      resourceId,
      timestamp: new Date(),
      metadata: {
        action,
        ...metadata,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log configuration change
   */
  async logConfigurationChange(
    userId: string,
    tenantId: string,
    configKey: string,
    oldValue: unknown,
    newValue: unknown
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      tenantId,
      action: 'config:change',
      resource: 'configuration',
      resourceId: configKey,
      timestamp: new Date(),
      metadata: {
        configKey,
        oldValue,
        newValue,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    tenantId: string,
    eventType: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'permission_denied',
    details: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.security.audit.enabled) {
      return;
    }

    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      tenantId,
      action: `security:${eventType}`,
      resource: 'security',
      resourceId: eventType,
      timestamp: new Date(),
      metadata: {
        eventType,
        ...details,
      },
    };

    await this.writeAuditLog(auditLog);
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(
    filters: {
      userId?: string;
      tenantId?: string;
      action?: string;
      resource?: string;
      resourceId?: string;
      from?: Date;
      to?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    let filteredLogs = this.auditLogs;

    // Apply filters
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.tenantId) {
      filteredLogs = filteredLogs.filter(log => log.tenantId === filters.tenantId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!));
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
    }

    if (filters.resourceId) {
      filteredLogs = filteredLogs.filter(log => log.resourceId === filters.resourceId);
    }

    if (filters.from) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.from!);
    }

    if (filters.to) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.to!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filteredLogs.length;
    const logs = filteredLogs.slice(offset, offset + limit);

    return { logs, total };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<{
    summary: {
      totalEvents: number;
      successfulEvents: number;
      failedEvents: number;
      uniqueUsers: number;
      topActions: Array<{ action: string; count: number }>;
    };
    logs: AuditLog[];
  }> {
    const { logs } = await this.queryAuditLogs({
      tenantId,
      from,
      to,
    }, 10000); // Large limit for report

    const successfulEvents = logs.filter(log => 
      log.metadata?.success === true
    ).length;

    const failedEvents = logs.filter(log => 
      log.metadata?.success === false
    ).length;

    const uniqueUsers = new Set(logs.map(log => log.userId)).size;

    // Count actions
    const actionCounts = new Map<string, number>();
    logs.forEach(log => {
      const action = log.action.split(':')[0]; // Get base action
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      summary: {
        totalEvents: logs.length,
        successfulEvents,
        failedEvents,
        uniqueUsers,
        topActions,
      },
      logs,
    };
  }

  /**
   * Write audit log
   */
  private async writeAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      // Store in memory (in production, this would be stored in a database)
      this.auditLogs.push(auditLog);

      // Log to file
      this.logger.info('Audit log entry', auditLog);

      // Clean up old logs based on retention policy
      await this.cleanupOldLogs();
    } catch (error) {
      this.logger.error('Failed to write audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        auditLog,
      });
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  private async cleanupOldLogs(): Promise<void> {
    const retentionDays = parseInt(this.config.security.audit.retention.replace('d', ''), 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);
  }

  /**
   * Extract user ID from arguments
   */
  private extractUserId(arguments_: Record<string, unknown>): string {
    return (arguments_.userId as string) || 'anonymous';
  }

  /**
   * Extract tenant ID from arguments
   */
  private extractTenantId(arguments_: Record<string, unknown>): string {
    return (arguments_.tenantId as string) || 'default';
  }

  /**
   * Sanitize arguments for audit log
   */
  private sanitizeArguments(arguments_: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(arguments_)) {
      // Remove sensitive data
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize result for audit log
   */
  private sanitizeResult(result: unknown): unknown {
    if (typeof result === 'object' && result !== null) {
      const sanitized: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return result;
  }

  /**
   * Sanitize error for audit log
   */
  private sanitizeError(error: unknown): unknown {
    if (error instanceof TaskMarshalError) {
      return {
        code: error._code,
        message: error.message,
        details: error._details,
      };
    }
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    return error;
  }

  /**
   * Check if key contains sensitive information
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'apiKey',
      'private',
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    tenantId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { logs } = await this.queryAuditLogs({ tenantId }, 10000);
    
    if (format === 'csv') {
      return this.convertToCSV(logs);
    }
    
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Convert audit logs to CSV format
   */
  private convertToCSV(logs: AuditLog[]): string {
    const headers = [
      'ID',
      'User ID',
      'Tenant ID',
      'Action',
      'Resource',
      'Resource ID',
      'Timestamp',
      'Metadata',
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.userId,
      log.tenantId,
      log.action,
      log.resource,
      log.resourceId,
      log.timestamp.toISOString(),
      JSON.stringify(log.metadata),
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}
