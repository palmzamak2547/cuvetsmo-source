#!/usr/bin/env node
// cuvetsmo-source MCP server — streamable-HTTP transport.
//
// For remote ecosystem surfaces that can't spawn a local stdio process — e.g.
// cuvetsmo.com/chat calling the data plane server-side, or a hosted VetOS
// agent. Same tools + same one-source-of-truth data as the stdio entry.
//
// Run:  PORT=8848 node dist/http.js
// Endpoint:  POST/GET/DELETE http://host:PORT/mcp   (MCP Streamable HTTP)
//            GET  http://host:PORT/health           (plain liveness JSON)
//
// Session model: one StreamableHTTPServerTransport per MCP session, keyed by
// the mcp-session-id header. New sessions are created on an initialize request.
// This mirrors the MCP SDK's documented streamable-HTTP server pattern.

import { createServer as createMcpServer, TOOLS } from './server.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { DRUGS } from './data.js'
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8848)
const ALLOWED_ORIGIN = process.env.MCP_ALLOWED_ORIGIN ?? '*'

// session id -> transport
const transports = new Map<string, StreamableHTTPServerTransport>()

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', c => { data += c; if (data.length > 4_000_000) reject(new Error('body too large')) })
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : undefined) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
  // permissive CORS for ecosystem surfaces; tighten via MCP_ALLOWED_ORIGIN in prod
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', transport: 'streamable-http', drugs: DRUGS.length, tools: TOOLS.length, dataPlane: 'source.cuvetsmo.com' }))
    return
  }

  if (url.pathname !== '/mcp') { res.writeHead(404).end('not found'); return }

  const sessionId = req.headers['mcp-session-id'] as string | undefined
  let transport = sessionId ? transports.get(sessionId) : undefined

  try {
    if (req.method === 'POST') {
      const body = await readBody(req)
      if (!transport) {
        // a new session must begin with an initialize request
        if (!isInitializeRequest(body)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'No valid session; first request must be initialize.' }, id: null }))
          return
        }
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid: string) => { transports.set(sid, transport!) },
        })
        transport.onclose = () => { if (transport!.sessionId) transports.delete(transport!.sessionId) }
        const server = createMcpServer()
        await server.connect(transport)
      }
      await transport.handleRequest(req, res, body)
      return
    }
    if (req.method === 'GET' || req.method === 'DELETE') {
      // GET = open SSE stream for an existing session; DELETE = end it
      if (!transport) { res.writeHead(400).end('Unknown or missing mcp-session-id'); return }
      await transport.handleRequest(req, res)
      return
    }
    res.writeHead(405).end('method not allowed')
  } catch (e) {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: (e as Error).message }, id: null }))
  }
})

httpServer.listen(PORT, () => {
  console.error(`cuvetsmo-source MCP (streamable-http) on :${PORT}/mcp · ${DRUGS.length} drugs · ${TOOLS.length} tools`)
})
