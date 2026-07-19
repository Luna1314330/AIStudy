import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { buildIatAuthUrl } from './scripts/xfyunAuth.js'

function withCozeAuth(proxyOptions, token) {
  return {
    ...proxyOptions,
    changeOrigin: true,
    secure: true,
    configure: (proxyServer) => {
      proxyServer.on('proxyReq', (proxyReq) => {
        if (token) {
          proxyReq.setHeader('Authorization', `Bearer ${token}`)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cozeToken = env.VITE_COZE_API_TOKEN || ''
  const apiMode = env.VITE_COZE_API_MODE || 'bot'
  const apiDomain = (env.VITE_COZE_API_DOMAIN || '').replace(/^https?:\/\//, '')
  const readingApiDomain = (env.VITE_COZE_READING_API_DOMAIN || apiDomain).replace(
    /^https?:\/\//,
    ''
  )

  const proxy = {}

  // 更具体的路径必须放在 /api/coze-agent 前面，否则会被写作代理前缀误匹配
  if (apiMode === 'coding' && readingApiDomain) {
    proxy['/api/coze-agent-reading'] = withCozeAuth(
      {
        target: `https://${readingApiDomain}`,
        rewrite: (path) => path.replace(/^\/api\/coze-agent-reading/, ''),
      },
      cozeToken
    )
  }

  if (apiMode === 'coding' && apiDomain) {
    proxy['/api/coze-agent'] = withCozeAuth(
      {
        target: `https://${apiDomain}`,
        rewrite: (path) => path.replace(/^\/api\/coze-agent/, ''),
      },
      cozeToken
    )
  }

  // 只匹配 /api/coze/*，排除 /api/coze-agent/*
  proxy['^/api/coze(?!-agent)'] = withCozeAuth(
    {
      target: env.VITE_COZE_BASE_URL || 'https://api.coze.cn',
      rewrite: (path) => path.replace(/^\/api\/coze/, ''),
    },
    cozeToken
  )

  const voiceBase =
    env.VITE_VOICE_API_BASE ||
    (apiDomain ? `https://${apiDomain.replace(/^https?:\/\//, '')}` : '')

  if (voiceBase) {
    const voiceTarget = voiceBase.startsWith('http') ? voiceBase : `https://${voiceBase}`
    proxy['/api/voice'] = withCozeAuth(
      {
        target: voiceTarget,
        rewrite: (path) => path.replace(/^\/api\/voice/, ''),
      },
      cozeToken
    )
  }

  function xfyunIatUrlPlugin() {
    return {
      name: 'xfyun-iat-url',
      configureServer(server) {
        server.middlewares.use('/api/xfyun/iat-url', (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }

          const appId = env.XFYUN_APP_ID
          const apiKey = env.XFYUN_API_KEY
          const apiSecret = env.XFYUN_API_SECRET

          if (!appId || !apiKey || !apiSecret) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                error:
                  '未配置讯飞语音识别。请在 .env.local 填写 XFYUN_APP_ID、XFYUN_API_KEY、XFYUN_API_SECRET',
              })
            )
            return
          }

          const url = buildIatAuthUrl({ apiKey, apiSecret })
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ url, appId }))
        })
      },
    }
  }

  return {
    plugins: [react(), xfyunIatUrlPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy,
    },
  }
})
