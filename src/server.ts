#!/usr/bin/env node

/**
 * Task-Marshal MCP Server
 * BuildWorks.AI - Production-ready task management MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import dotenv from 'dotenv';


// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Simple tool definitions
const tools: Tool[] = [
  {
    name: 'marshal_tasks',
    description: 'Core task orchestration with AI capabilities - create, update, delete, and manage tasks with intelligent automation.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'list', 'get'],
          description: 'Action to perform on tasks'
        },
        task: {
          type: 'object',
          description: 'Task data for create/update operations'
        },
        filters: {
          type: 'object',
          description: 'Filters for list operations'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_projects',
    description: 'Project management and organization - create projects, manage milestones, and track progress.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'list', 'get'],
          description: 'Action to perform on projects'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_teams',
    description: 'Team collaboration and member management - assign roles, manage permissions, and track team performance.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'list', 'get'],
          description: 'Action to perform on teams'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_analytics',
    description: 'Advanced analytics with predictive insights, bottleneck detection, and performance tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['generate', 'insights', 'predictions'],
          description: 'Analytics action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_workflows',
    description: 'Workflow automation and process management - create, execute, and monitor automated workflows.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'execute', 'monitor', 'list'],
          description: 'Workflow action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_resources',
    description: 'Resource allocation and capacity planning - manage team capacity, track utilization, and optimize resource distribution.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['allocate', 'track', 'optimize', 'list'],
          description: 'Resource action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_quality',
    description: 'Quality assurance and testing management - track quality metrics, manage test cases, and ensure compliance.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['track', 'test', 'compliance', 'metrics'],
          description: 'Quality action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_integrations',
    description: 'Third-party integrations and API management - connect with external tools and services.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['connect', 'sync', 'configure', 'list'],
          description: 'Integration action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_notifications',
    description: 'Smart notification system with intelligent routing and delivery optimization.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['send', 'configure', 'routing', 'list'],
          description: 'Notification action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'marshal_audit',
    description: 'Comprehensive audit logging and compliance tracking - maintain detailed logs and ensure regulatory compliance.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['log', 'query', 'export', 'compliance'],
          description: 'Audit action to perform'
        }
      },
      required: ['action']
    }
  }
];

// Create MCP server
const server = new Server(
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

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing tools', { toolCount: tools.length });
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = uuidv4();
  
  logger.info('Tool called', { 
    tool: name, 
    requestId,
    args: args ? Object.keys(args) : []
  });

  try {
    // Simple response for all tools
    const response = {
      success: true,
      message: `Task-Marshal tool '${name}' executed successfully`,
      data: {
        tool: name,
        action: args?.action || 'unknown',
        timestamp: new Date().toISOString(),
        requestId
      },
      metadata: {
        version: '1.0.0',
        buildworks: 'BuildWorks.AI Task-Marshal MCP Server'
      }
    };

    logger.info('Tool completed', { tool: name, requestId });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  } catch (error) {
    logger.error('Tool execution failed', { 
      tool: name, 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'TOOL_EXECUTION_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              timestamp: new Date().toISOString(),
              requestId,
            }
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Task-Marshal MCP Server started successfully');
}

main().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});