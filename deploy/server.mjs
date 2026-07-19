/**
 * 生产环境 Node 服务：托管 dist 静态文件 + 代理 Coze / 讯飞 API
 * Token 只留在服务器，不会打进前端 JS。
 */
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIatAuthUrl } from '../scripts/xfyunAuth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const env = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = {
  ...loadEnvFile(path.join(rootDir, '.env.production')),
  ...loadEnvFile(path.join(rootDir, '.env.production.local')),
  ...loadEnvFile(path.join(rootDir, '.env.local')),
  ...process.env,
}

const cozeToken = env.VITE_COZE_API_TOKEN || env.COZE_API_TOKEN || ''
const writingDomain = (env.VITE_COZE_API_DOMAIN || '').replace(/^https?:\/\//, '')
const readingDomain = (env.VITE_COZE_READING_API_DOMAIN || writingDomain).replace(
  /^https?:\/\//,
  ''
)
const voiceBase = (env.VITE_VOICE_API_BASE || (writingDomain ? `https://${writingDomain}` : '')).replace(
  /\/$/,
  ''
)
const port = Number(env.PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function proxyToHttps(req, res, targetOrigin, rewritePrefix) {
  if (!cozeToken) {
    sendJson(res, 500, { error: '服务器未配置 VITE_COZE_API_TOKEN' })
    return
  }

  const target = new URL(targetOrigin)
  const requestPath = req.url.replace(rewritePrefix, '') || '/'

  const headers = { ...req.headers, host: target.host, authorization: `Bearer ${cozeToken}` }
  delete headers.connection

  const proxyReq = https.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      method: req.method,
      path: requestPath,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
      })
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (error) => {
    sendJson(res, 502, { error: error.message || '代理请求失败' })
  })

  req.pipe(proxyReq)
}

function handleXfyunAuth(res) {
  const appId = env.XFYUN_APP_ID
  const apiKey = env.XFYUN_API_KEY
  const apiSecret = env.XFYUN_API_SECRET

  if (!appId || !apiKey || !apiSecret) {
    sendJson(res, 500, {
      error: '服务器未配置讯飞语音识别（XFYUN_APP_ID / XFYUN_API_KEY / XFYUN_API_SECRET）',
    })
    return
  }

  const url = buildIatAuthUrl({ apiKey, apiSecret })
  sendJson(res, 200, { url, appId })
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath)

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { error: 'Forbidden' })
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html')
  }

  const ext = path.extname(filePath)
  const type = MIME[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  fs.createReadStream(filePath).pipe(res)
}

function route(req, res) {
  const url = req.url.split('?')[0]

  if (url === '/api/xfyun/iat-url' && req.method === 'GET') {
    handleXfyunAuth(res)
    return
  }

  if (url.startsWith('/api/coze-agent-reading/') && readingDomain) {
    proxyToHttps(req, res, `https://${readingDomain}`, '/api/coze-agent-reading')
    return
  }

  if (url.startsWith('/api/coze-agent/') && writingDomain) {
    proxyToHttps(req, res, `https://${writingDomain}`, '/api/coze-agent')
    return
  }

  if (url.startsWith('/api/voice/') && voiceBase) {
    proxyToHttps(req, res, voiceBase, '/api/voice')
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method Not Allowed' })
    return
  }

  serveStatic(req, res)
}

if (!fs.existsSync(distDir)) {
  console.error('未找到 dist/，请先在项目根目录执行：npm run build')
  process.exit(1)
}

http.createServer(route).listen(port, '0.0.0.0', () => {
  console.log(`学习小助手已启动：http://0.0.0.0:${port}`)
  console.log(`静态目录：${distDir}`)
  if (!cozeToken) console.warn('警告：未配置 Coze Token，对话接口不可用')
})
