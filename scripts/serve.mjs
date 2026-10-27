/**
 * scripts/serve.mjs —— 零依赖静态服务器，只为本地看 demo
 * 用法：node scripts/serve.mjs [端口]
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.argv[2]) || 5173
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  const rel = normalize(url === '/' ? '/demo/index.html' : url).replace(/^(\.\.[/\\])+/, '')
  const file = join(root, rel)
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden')
    return
  }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`demo: http://127.0.0.1:${port}/`)
})
