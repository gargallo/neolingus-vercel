# Supabase MCP Setup for Claude Code

This project has been configured to work with Supabase MCP (Model Context Protocol) for Claude Code integration.

## Configuration Files

### `.mcp.json` (Project-scoped MCP server)

This file configures the Supabase MCP server for Claude Code with the following settings:

- **Read-only mode**: Enabled for safety (prevents accidental database modifications)
- **Project Reference**: `jkirhngfztxbvcdzbczl`
- **Access Token**: Configured via environment variable

### `.env.local` (Environment Variables)

Added the following environment variable:

```
SUPABASE_ACCESS_TOKEN=sbp_caf21fd5a7585bcf5980e3eda4890b472cbca6b8
```

## What This Enables

With this setup, Claude Code can now:

- Query your Supabase database tables
- Inspect database schema
- Access project configuration
- Manage Supabase projects (create, configure)
- And more Supabase operations

## Usage

1. **Restart Claude Code** to apply the new MCP configuration
2. You should see a hammer (MCP) icon indicating the Supabase server is available
3. You can now ask Claude Code to interact with your Supabase project

## Security Notes

- The configuration uses **read-only mode** by default for database operations
- Project management operations (like creating projects) are still available
- Keep your access token secure and don't commit it to version control

## Testing the Connection

To test if the MCP server works correctly:

```bash
SUPABASE_ACCESS_TOKEN=sbp_caf21fd5a7585bcf5980e3eda4890b472cbca6b8 npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=jkirhngfztxbvcdzbczl
```

## Additional Configuration Options

If you want to enable write operations (not recommended for AI), remove the `--read-only` flag from the `.mcp.json` configuration.

For more information, see: https://supabase.com/docs/guides/getting-started/mcp#claude-code
