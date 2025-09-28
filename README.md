# Task Marshal MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![npm package](https://img.shields.io/npm/v/buildworks-ai-task-marshal.svg?label=npm%20package)](https://www.npmjs.com/package/buildworks-ai-task-marshal)
[![Publish status](https://img.shields.io/badge/publish-manual-blue?logo=github)](PUBLISHING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue?logo=typescript)](tsconfig.json)
[![Downloads](https://img.shields.io/npm/dm/buildworks-ai-task-marshal.svg?label=downloads)](https://www.npmjs.com/package/buildworks-ai-task-marshal)

> **Latest release:** `1.1.0` – filesystem-backed persistence with initiatives, subtasks, dependencies, integrity verification, and rollback mode.

## Overview

Task Marshal is BuildWorks.AI's multi-tool Model Context Protocol (MCP) server for task, project, and operations workflows. The current implementation (see `src/server.ts`) exposes ten deterministic tools that accept structured JSON via MCP and return standardized success payloads. Task Marshal is designed to be a lightweight companion server that you can enable alongside other BuildWorks.AI MCP services.

## Highlights

- **Ten focused tools**: Covers tasks, projects, workflows, teams, analytics, resources, quality, integrations, notifications, and audit utilities.
- **MCP stdio compliant**: Uses `@modelcontextprotocol/sdk` with `StdioServerTransport`; all logging is written to STDERR to avoid corrupting STDOUT frames.
- **Deterministic responses**: Each tool returns a consistent JSON payload that includes a generated `requestId`, the provided `action`, and version metadata so client automations can chain calls predictably.

## Tool Catalog

| Tool name | Description | Required argument(s) |
| --- | --- | --- |
| `marshal_tasks` | Orchestrate task operations (create, update, list, etc.). | `action` (string)
| `marshal_projects` | Manage project lifecycle operations. | `action`
| `marshal_teams` | Coordinate team assignments and lookups. | `action`
| `marshal_analytics` | Request analytics workflows (generate, insights, predictions). | `action`
| `marshal_workflows` | Initiate or monitor automation workflows. | `action`
| `marshal_resources` | Handle resource allocation and tracking. | `action`
| `marshal_quality` | Trigger quality and compliance checks. | `action`
| `marshal_integrations` | Configure third-party integrations. | `action`
| `marshal_notifications` | Manage notification delivery. | `action`
| `marshal_audit` | Record or query audit events. | `action`

All tools accept optional additional fields, which are echoed back in the log context for observability.

## Installation

### Run with NPX (recommended)

```bash
npx buildworks-ai-task-marshal@1.1.0
```

### Install as a project dependency

```bash
npm install buildworks-ai-task-marshal
# or
pnpm add buildworks-ai-task-marshal
```

### From source

```bash
git clone https://github.com/buildworksai/task-marshal.git
cd task-marshal
npm install
npm run build
```

## MCP Configuration Example

Add the server to your MCP client configuration (Cursor, Windsurf, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "task-marshal": {
      "command": "npx",
      "args": ["buildworks-ai-task-marshal@1.1.0"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Usage

### Listing available tools

Clients issue a `ListTools` request and receive the descriptions defined in `src/server.ts`:

```json
{
  "tools": [
    {
      "name": "marshal_tasks",
      "description": "Core task orchestration with AI capabilities - create, update, delete, and manage tasks with intelligent automation.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "action": {"type": "string"}
        },
        "required": ["action"]
      }
    }
    // ...remaining tools
  ]
}
```

### Calling a tool

Every tool returns a standard payload. For example, invoking `marshal_tasks` with `action: "create"` produces:

```json
{
  "success": true,
  "message": "Task-Marshal tool 'marshal_tasks' executed successfully",
  "data": {
    "tool": "marshal_tasks",
    "action": "create",
    "timestamp": "2025-09-27T04:40:01.234Z",
    "requestId": "5585df1f-5b63-4bcc-9c87-b3f0f1c93378"
  },
  "metadata": {
    "version": "1.1.0",
    "buildworks": "BuildWorks.AI Task-Marshal MCP Server"
  }
}
```

## Configuration

- **`NODE_ENV`**: Defaults to `production`. Adjust as needed for development.
- **`LOG_LEVEL`**: Controls Winston logging verbosity (default `info`). Logs are routed to STDERR, leaving STDOUT free for MCP frames.

## Development Workflow

- **Install dependencies**: `npm install`
- **Watch mode**: `npm run dev` (powered by `tsx`)
- **Build**: `npm run build`
- **Tests**: `npm test`
- **Lint**: `npm run lint`

The compiled server is emitted to `dist/server.js` and marked executable for use by MCP clients.

## Version History

- **1.1.0** – Filesystem-backed persistence with initiatives, subtasks, dependencies, integrity verification, and rollback mode.
  - Added `.taskmarshal/` directory structure for persistent storage
  - Enhanced task schema with subtasks, governance states, and UX metadata
  - Dependency validation with cycle detection and chronological order enforcement
  - HMAC signing for data integrity and tamper detection
  - Journaling system for atomic operations and recovery
  - Rollback mode for emergency fallback to in-memory storage
  - Comprehensive test suite for filesystem operations
- **1.0.8** – Redirect logs to STDERR for MCP compliance, refresh documentation, bump package metadata.
- **1.0.7** – Initial public release of the Task Marshal MCP server.

## Publishing

Publishing instructions, registry token setup, and GitHub Packages guidance live in [`PUBLISHING.md`](PUBLISHING.md). Review that document before running any release workflows.

## Support & Feedback

- **Issues & feature requests**: [GitHub Issues](https://github.com/buildworksai/task-marshal/issues)
- **BuildWorks.AI contact**: support@buildworks.ai

## License

Task Marshal is released under the [MIT License](LICENSE).
