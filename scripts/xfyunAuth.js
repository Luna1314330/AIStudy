import crypto from 'node:crypto'

/**
 * 讯飞语音听写（流式版）WebSocket 鉴权 URL
 * @see https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */
export function buildIatAuthUrl({
  apiKey,
  apiSecret,
  host = 'iat-api.xfyun.cn',
  path = '/v2/iat',
}) {
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64')

  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')

  const params = new URLSearchParams({ authorization, date, host })
  return `wss://${host}${path}?${params.toString()}`
}
