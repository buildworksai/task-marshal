# Task Marshal 1.1.0 Usage Guide

## Quick Start

```bash
# Install globally
npm install -g buildworks-ai-task-marshal@1.1.0

# Or run directly
npx buildworks-ai-task-marshal@1.1.0
```

## Filesystem Storage

All data is stored in `.taskmarshal/` directory with the following structure:

```
.taskmarshal/
├── initiative-id/
│   ├── manifest.json          # Initiative metadata
│   ├── manifest.json.sig      # HMAC signature
│   ├── tasks/
│   │   ├── task-id.json       # Individual task files
│   │   └── task-id.json.sig   # Task signatures
│   ├── dependencies.json      # Dependency contracts
│   ├── dependencies.json.sig  # Dependency signatures
│   └── journal.log           # Operation journal
```

## Environment Variables

- `TASK_MARSHAL_DATA_DIR`: Custom data directory (default: `.taskmarshal`)
- `TASK_MARSHAL_SIGNING_KEY`: HMAC signing key for integrity verification
- `TASK_MARSHAL_ROLLBACK_MODE`: Set to `true` to use in-memory storage only

## Enhanced Task Schema

Tasks now include:
- `initiativeId`: Required initiative identifier
- `parentTaskId`: For subtask relationships
- `subtasks`: Array of embedded subtask objects
- `governanceState`: Current workflow state
- `visualPriority`: UX rendering hint (1-10)
- `insightCards`: AI-generated insights
- `narrativeContext`: Rich context for AI processing
- `aiSignals`: Integration hooks for AI systems

## Dependency Management

### Creating Tasks with Dependencies

```json
{
  "action": "create",
  "task": {
    "title": "Deploy to Production",
    "initiativeId": "release-2024",
    "dependencies": ["task-123", "task-456"],
    "dueDate": "2024-12-31T23:59:59Z"
  }
}
```

### Automatic Validation

- **Cycle Detection**: Prevents circular dependencies
- **Chronological Order**: Ensures dependencies complete before dependents
- **Integrity Checks**: HMAC signatures verify data hasn't been tampered with

## Initiative Management

### Create Initiative (via tasks)

```json
{
  "action": "create",
  "task": {
    "title": "Q4 Product Launch",
    "initiativeId": "q4-launch-2024",
    "description": "Complete product launch for Q4"
  }
}
```

### List All Tasks in Initiative

```json
{
  "action": "list",
  "filters": {
    "initiativeId": "q4-launch-2024"
  }
}
```

### Analyze Initiative

```json
{
  "action": "analyze",
  "filters": {
    "initiativeId": "q4-launch-2024"
  }
}
```

## Rollback Mode

For emergency fallback:

```bash
# Enable rollback mode
export TASK_MARSHAL_ROLLBACK_MODE=true

# Run server
npx buildworks-ai-task-marshal@1.1.0
```

In rollback mode:
- Uses in-memory storage only
- No filesystem operations
- Preserves 1.0.8 behavior
- Useful for debugging or emergency recovery

## Security Features

- **HMAC Signatures**: All files are signed with `TASK_MARSHAL_SIGNING_KEY`
- **Directory Permissions**: `.taskmarshal/` created with 0700 permissions
- **Integrity Verification**: Automatic detection of tampered files
- **Journal Recovery**: Atomic operations with replay capability

## Example MCP Configuration

```json
{
  "mcpServers": {
    "task-marshal": {
      "command": "npx",
      "args": ["buildworks-ai-task-marshal@1.1.0"],
      "env": {
        "TASK_MARSHAL_DATA_DIR": "/path/to/data",
        "TASK_MARSHAL_SIGNING_KEY": "your-secret-key-here"
      }
    }
  }
}
```

## Migration from 1.0.x

1. **Backup**: Ensure you have backups before upgrading
2. **Rollback**: Use rollback mode if needed for compatibility
3. **Data**: 1.1.0 is backward compatible - no data migration required
4. **Testing**: Run `npm test` to verify functionality

## Advanced Usage

### Subtasks

```json
{
  "action": "create",
  "task": {
    "title": "Main Task",
    "initiativeId": "project-alpha",
    "subtasks": [
      {
        "id": "sub-1",
        "title": "Research phase",
        "status": "pending"
      },
      {
        "id": "sub-2", 
        "title": "Implementation",
        "status": "pending"
      }
    ]
  }
}
```

### Dependency Contracts

Dependencies are automatically validated for:
- Circular dependencies
- Chronological order violations
- Missing dependency tasks
- SLA compliance

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure `.taskmarshal/` has 0700 permissions
2. **Signature Mismatch**: Verify `TASK_MARSHAL_SIGNING_KEY` is consistent
3. **Initiative Not Found**: Check `initiativeId` format and existence
4. **Dependency Errors**: Review task dependencies for cycles or missing tasks

### Debug Commands

```bash
# Check data integrity
find .taskmarshal -name "*.sig" -exec cat {} \;

# View journal
tail -f .taskmarshal/*/journal.log

# List initiatives
ls -la .taskmarshal/
```
