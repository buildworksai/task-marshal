#!/usr/bin/env node

/**
 * Task-Marshal MCP Server
 * BuildWorks.AI - Production-ready MCP server for intelligent task management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import dotenv from 'dotenv';

// Import tools
import { MarshalTasksTool } from './tools/marshal_tasks.js';
import { MarshalProjectsTool } from './tools/marshal_projects.js';
import { MarshalWorkflowsTool } from './tools/marshal_workflows.js';
import { MarshalTeamsTool } from './tools/marshal_teams.js';
import { MarshalAnalyticsTool } from './tools/marshal_analytics.js';
import { MarshalResourcesTool } from './tools/marshal_resources.js';
import { MarshalQualityTool } from './tools/marshal_quality.js';
import { MarshalIntegrationsTool } from './tools/marshal_integrations.js';
import { MarshalNotificationsTool } from './tools/marshal_notifications.js';
import { MarshalAuditTool } from './tools/marshal_audit.js';

// Import utilities
import { ValidationUtils } from './utils/validation.js';
import { SecurityUtils } from './utils/security.js';
import { AuditLogger } from './utils/audit.js';
import { TaskMarshalConfig, TaskMarshalError } from './types/index.js';

// Load environment variables
dotenv.config();

/**
 * Task-Marshal MCP Server Class
 */
class TaskMarshalServer {
  private server: Server;
  private logger: winston.Logger;
  private config: TaskMarshalConfig;
  private tools: Map<string, any> = new Map();
  private auditLogger: AuditLogger;

  constructor() {
    this.config = this.loadConfig();
    this.logger = this.setupLogger();
    this.auditLogger = new AuditLogger(this.config, this.logger);
    this.server = new Server(
      {
        name: 'task-marshal',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): TaskMarshalConfig {
    return {
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
        logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      },
      database: {
        url: process.env.DATABASE_URL || 'sqlite:./data/task-marshal.db',
        type: (process.env.DATABASE_TYPE as 'sqlite' | 'postgresql' | 'mysql') || 'sqlite',
      },
      security: {
        rbac: {
          enabled: process.env.RBAC_ENABLED === 'true',
          roles: [],
        },
        audit: {
          enabled: process.env.AUDIT_ENABLED === 'true',
          logLevel: (process.env.AUDIT_LOG_LEVEL as 'minimal' | 'standard' | 'comprehensive') || 'standard',
          retention: process.env.AUDIT_RETENTION || '90d',
        },
        tenantIsolation: {
          enabled: process.env.TENANT_ISOLATION_ENABLED === 'true',
          multiTenant: process.env.MULTI_TENANT === 'true',
        },
      },
      ai: {
        enabled: process.env.AI_ENABLED === 'true',
        provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic' | 'custom') || 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.AI_MODEL || 'gpt-4',
      },
      integrations: {
        github: process.env.GITHUB_TOKEN ? {
          token: process.env.GITHUB_TOKEN,
          webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
        } : undefined,
        slack: process.env.SLACK_TOKEN ? {
          token: process.env.SLACK_TOKEN,
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        } : undefined,
        jira: process.env.JIRA_URL ? {
          url: process.env.JIRA_URL,
          username: process.env.JIRA_USERNAME || '',
          apiToken: process.env.JIRA_API_TOKEN || '',
        } : undefined,
      },
    };
  }

  /**
   * Setup Winston logger
   */
  private setupLogger(): winston.Logger {
    return winston.createLogger({
      level: this.config.server.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'task-marshal' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  /**
   * Setup all Task-Marshal tools
   */
  private setupTools(): void {
    // Initialize tools with configuration
    this.tools.set('marshal_tasks', new MarshalTasksTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_projects', new MarshalProjectsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_workflows', new MarshalWorkflowsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_teams', new MarshalTeamsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_analytics', new MarshalAnalyticsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_resources', new MarshalResourcesTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_quality', new MarshalQualityTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_integrations', new MarshalIntegrationsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_notifications', new MarshalNotificationsTool(this.config, this.logger, this.auditLogger));
    this.tools.set('marshal_audit', new MarshalAuditTool(this.config, this.logger, this.auditLogger));

    this.logger.info('Task-Marshal tools initialized', { toolCount: this.tools.size });
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map(tool => tool.getToolDefinition());
      
      this.logger.debug('List tools requested', { toolCount: tools.length });
      
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = uuidv4();
      const startTime = Date.now();

      this.logger.info('Tool call requested', {
        toolName: name,
        requestId,
        hasArguments: !!args,
      });

      try {
        // Validate tool exists
        const tool = this.tools.get(name);
        if (!tool) {
          throw new TaskMarshalError('TOOL_NOT_FOUND', `Tool '${name}' not found`);
        }

        // Validate arguments
        const validatedArgs = await ValidationUtils.validateToolArguments(name, args);
        
        // Execute tool
        const result = await tool.execute(validatedArgs, requestId);
        
        const duration = Date.now() - startTime;
        this.logger.info('Tool call completed', {
          toolName: name,
          requestId,
          duration,
          success: true,
        });

        // Audit log
        await this.auditLogger.logToolCall(name, validatedArgs, result, requestId, duration);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.logger.error('Tool call failed', {
          toolName: name,
          requestId,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Audit log error
        await this.auditLogger.logToolError(name, args, error, requestId, duration);

        if (error instanceof TaskMarshalError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                  },
                  metadata: {
                    timestamp: new Date().toISOString(),
                    requestId,
                    duration,
                  },
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        // Generic error response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An internal error occurred',
                },
                metadata: {
                  timestamp: new Date().toISOString(),
                  requestId,
                  duration,
                },
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });

    this.logger.info('Task-Marshal MCP server handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('Task-Marshal MCP server started', {
        version: '1.0.0',
        tools: Array.from(this.tools.keys()),
        config: {
          logLevel: this.config.server.logLevel,
          rbacEnabled: this.config.security.rbac.enabled,
          auditEnabled: this.config.security.audit.enabled,
          aiEnabled: this.config.ai.enabled,
        },
      });
    } catch (error) {
      this.logger.error('Failed to start Task-Marshal MCP server', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Task-Marshal MCP server');
    
    try {
      await this.server.close();
      this.logger.info('Task-Marshal MCP server shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ============================================================================
// Server Startup
// ============================================================================

const server = new TaskMarshalServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
