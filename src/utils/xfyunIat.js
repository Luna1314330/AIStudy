const TARGET_SAMPLE_RATE = 16000
const MAX_VAD_RECONNECTS = 5

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }
  return buffer
}

function downsampleTo16k(float32Array, inputSampleRate) {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return float32Array
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE
  const length = Math.round(float32Array.length / ratio)
  const result = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    result[i] = float32Array[Math.floor(i * ratio)]
  }
  return result
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function buildMergedText(segments) {
  return Object.keys(segments)
    .map(Number)
    .sort((a, b) => a - b)
    .map((sn) => segments[sn])
    .join('')
}

function applyStreamResult(segments, result, piece) {
  if (!piece) return buildMergedText(segments)
  segments[result.sn] = piece
  return buildMergedText(segments)
}

function extractIatText(payload) {
  if (payload.code !== 0) {
    throw new Error(payload.message || `讯飞识别错误 (${payload.code})`)
  }
  const ws = payload.data?.result?.ws
  if (!Array.isArray(ws)) return ''
  return ws
    .map((item) => (item.cw || []).map((cw) => cw.w).join(''))
    .join('')
}

async function fetchIatConfig() {
  const response = await fetch('/api/xfyun/iat-url')
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '获取讯飞鉴权地址失败')
  }
  if (!data.url || !data.appId) {
    throw new Error('讯飞鉴权接口未返回 url 或 appId')
  }
  return data
}

export function createXfyunIatRecognizer({
  onResult,
  onStart,
  onEnd,
  onError,
  language = 'zh_cn',
  accent = 'mandarin',
  eos = 10000,
  maxVadReconnects = MAX_VAD_RECONNECTS,
}) {
  let ws = null
  let audioContext = null
  let mediaStream = null
  let workletNode = null
  let processor = null
  let source = null
  let silentGain = null
  let pcmBuffer = []
  let pcmBytes = 0
  let sendTimer = null
  let status = 0
  let sessionText = ''
  let committedText = ''
  let resultSegments = {}
  let appId = ''
  let micReady = false
  let userRequestedStop = false
  let reconnecting = false
  let finished = false
  let vadReconnectCount = 0

  function getFullText() {
    return committedText + sessionText
  }

  function resetSessionSegments() {
    sessionText = ''
    resultSegments = {}
  }

  function commitSession() {
    committedText += sessionText
    resetSessionSegments()
  }

  function emitResult() {
    onResult?.(getFullText())
  }

  function appendPcm(float32Array, sampleRate) {
    const downsampled = downsampleTo16k(float32Array, sampleRate)
    const pcm = new Uint8Array(floatTo16BitPCM(downsampled))
    pcmBuffer.push(pcm)
    pcmBytes += pcm.length
  }

  function cleanupAudio() {
    if (sendTimer) {
      clearInterval(sendTimer)
      sendTimer = null
    }
    workletNode?.disconnect()
    processor?.disconnect()
    source?.disconnect()
    mediaStream?.getTracks().forEach((track) => track.stop())
    workletNode = null
    processor = null
    source = null
    silentGain = null
    mediaStream = null
    if (audioContext) {
      audioContext.close().catch(() => {})
      audioContext = null
    }
    pcmBuffer = []
    pcmBytes = 0
    micReady = false
  }

  function closeWs() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    ws = null
  }

  function finishRecognizer() {
    if (finished) return
    finished = true
    cleanupAudio()
    closeWs()
    onEnd?.(getFullText().trim())
  }

  function flushPcmFrame(audioStatus) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    let chunk = new Uint8Array(0)
    if (pcmBytes > 0) {
      chunk = new Uint8Array(pcmBytes)
      let offset = 0
      for (const part of pcmBuffer) {
        chunk.set(part, offset)
        offset += part.length
      }
      pcmBuffer = []
      pcmBytes = 0
    }

    const frame = {
      data: {
        status: audioStatus,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: chunk.length ? arrayBufferToBase64(chunk.buffer) : '',
      },
    }

    if (audioStatus === 0) {
      frame.common = { app_id: appId }
      frame.business = {
        language,
        domain: 'iat',
        accent,
        eos,
      }
    }

    ws.send(JSON.stringify(frame))
  }

  function startSendTimer() {
    if (sendTimer) return
    sendTimer = setInterval(() => {
      if (status === 1 && pcmBytes > 0) {
        flushPcmFrame(1)
      }
    }, 40)
  }

  function bindWsHandlers(socket) {
    socket.onmessage = handleMessage
    socket.onerror = () => {
      if (!userRequestedStop && !reconnecting) {
        onError?.('讯飞 WebSocket 连接失败')
      }
    }
    socket.onclose = () => {
      if (reconnecting) return
      if (userRequestedStop) {
        finishRecognizer()
      }
    }
  }

  async function openWs() {
    const config = await fetchIatConfig()
    appId = config.appId

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(config.url)
      socket.binaryType = 'arraybuffer'
      bindWsHandlers(socket)

      socket.onopen = () => {
        ws = socket
        flushPcmFrame(0)
        status = 1
        startSendTimer()
        resolve()
      }

      socket.onerror = () => {
        socket.onopen = null
        socket.close()
        reject(new Error('讯飞 WebSocket 连接失败'))
      }
    })
  }

  async function setupMic() {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext = new AudioContext()
    source = audioContext.createMediaStreamSource(mediaStream)

    silentGain = audioContext.createGain()
    silentGain.gain.value = 0
    silentGain.connect(audioContext.destination)

    try {
      await audioContext.audioWorklet.addModule('/xfyun-pcm-processor.js')
      workletNode = new AudioWorkletNode(audioContext, 'xfyun-pcm-processor')
      workletNode.port.onmessage = (event) => {
        const { samples, sampleRate } = event.data
        appendPcm(samples, sampleRate || audioContext.sampleRate)
      }
      source.connect(workletNode)
      workletNode.connect(silentGain)
    } catch {
      processor = audioContext.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (event) => {
        appendPcm(event.inputBuffer.getChannelData(0), audioContext.sampleRate)
      }
      source.connect(processor)
      processor.connect(silentGain)
    }

    micReady = true
  }

  async function reconnectAfterVad() {
    if (userRequestedStop || !micReady) return

    vadReconnectCount += 1
    if (vadReconnectCount > maxVadReconnects) {
      onError?.('语音识别暂停次数过多，请点击结束录音后重新开始')
      finishRecognizer()
      return
    }

    reconnecting = true
    resetSessionSegments()

    if (ws) {
      ws.onclose = null
      ws.onmessage = null
      ws.close()
      ws = null
    }

    try {
      await openWs()
      emitResult()
    } finally {
      reconnecting = false
    }
  }

  function handleMessage(event) {
    try {
      const payload = JSON.parse(event.data)
      const result = payload.data?.result
      const piece = extractIatText(payload)

      if (result && piece) {
        const nextSessionText = applyStreamResult(resultSegments, result, piece)
        const nextFullText = committedText + nextSessionText
        if (nextFullText.length >= getFullText().length) {
          sessionText = nextSessionText
          emitResult()
        }
      }

      if (payload.data?.status === 2) {
        if (userRequestedStop) {
          finishRecognizer()
        } else if (micReady && !reconnecting) {
          commitSession()
          reconnectAfterVad().catch((err) => {
            onError?.(err instanceof Error ? err.message : '语音识别重连失败')
            finishRecognizer()
          })
        }
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '解析讯飞结果失败')
    }
  }

  async function start() {
    if (ws || micReady) return

    userRequestedStop = false
    finished = false
    vadReconnectCount = 0
    committedText = ''
    resetSessionSegments()
    status = 0

    try {
      await setupMic()
      await openWs()
      onStart?.()
    } catch (err) {
      finished = false
      cleanupAudio()
      closeWs()
      onError?.(
        err instanceof Error && err.name === 'NotAllowedError'
          ? '麦克风权限被拒绝，请在浏览器设置中允许'
          : err instanceof Error
            ? err.message
            : '讯飞语音识别启动失败'
      )
    }
  }

  function stop() {
    userRequestedStop = true

    if (status === 1 && ws?.readyState === WebSocket.OPEN) {
      status = 2
      flushPcmFrame(2)
      return
    }

    finishRecognizer()
  }

  return { start, stop }
}
