#!/usr/bin/env node
// cuvetsmo-source MCP server — stdio transport (the universal MCP transport).
//
// Works with Claude Desktop, Claude Code .mcp.json, and any stdio MCP client.
// For remote ecosystem surfaces (cuvetsmo.com/chat server-side), run http.ts
// instead — same tools, streamable-HTTP transport.
//
// The data plane: this MCP reads the same content/drugs + data/ontology the
// website builds from. One source of truth, now two machine transports.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer, TOOLS } from './server.js'
import { DRUGS } from './data.js'

const server = createServer()
const transport = new StdioServerTransport()
await server.connect(transport)
// stderr so it doesn't corrupt the stdio JSON-RPC channel
console.error(`cuvetsmo-source MCP (stdio) ready · ${DRUGS.length} drugs · ${TOOLS.length} tools`)
