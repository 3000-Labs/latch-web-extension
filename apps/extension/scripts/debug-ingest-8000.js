#!/usr/bin/env node
/**
 * Temporary local debug ingest for Latch extension (session dcd3f5).
 * Listens on :8000 (already in extension host_permissions).
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const LOG_PATH = path.join(__dirname, '../../../.cursor/debug-dcd3f5.log')
const PORT = 8000

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Debug-Session-Id')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.method !== 'POST') {
    res.writeHead(404)
    res.end()
    return
  }
  let body = ''
  req.on('data', (c) => {
    body += c
  })
  req.on('end', () => {
    try {
      fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true })
      const line = body.trim()
      if (line) fs.appendFileSync(LOG_PATH, line + '\n')
    } catch (e) {
      console.error('write failed', e)
    }
    res.writeHead(204)
    res.end()
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[latch-debug] listening on http://127.0.0.1:${PORT} -> ${LOG_PATH}`)
})
