const COZE_WEB_SDK_URL =
  'https://lf-cdn.coze.cn/obj/unpkg/latest/coze/web-sdk/dist/js-umd/index.min.js'

let initialized = false

export function getCozeWebSdkConfig() {
  const projectId =
    import.meta.env.VITE_COZE_PROJECT_ID ||
    import.meta.env.VITE_COZE_CHAT_BOT_ID ||
    ''

  const token = import.meta.env.VITE_COZE_API_TOKEN || ''

  return { projectId, token }
}

export function validateCozeWebSdkConfig({ projectId, token }) {
  if (!projectId) return '未配置 VITE_COZE_PROJECT_ID'
  if (!token) return '未配置 VITE_COZE_API_TOKEN'
  return null
}

export function loadCozeWebSdkScript() {
  return new Promise((resolve, reject) => {
    if (window.cozeWebSDK) {
      resolve(window.cozeWebSDK)
      return
    }

    const existing = document.querySelector(`script[src="${COZE_WEB_SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.cozeWebSDK) resolve(window.cozeWebSDK)
        else reject(new Error('Coze Web SDK 未正确加载'))
      })
      existing.addEventListener('error', () => reject(new Error('Coze Web SDK 加载失败')))
      return
    }

    const script = document.createElement('script')
    script.src = COZE_WEB_SDK_URL
    script.async = true
    script.onload = () => {
      if (window.cozeWebSDK) resolve(window.cozeWebSDK)
      else reject(new Error('Coze Web SDK 未正确加载'))
    }
    script.onerror = () => reject(new Error('Coze Web SDK 加载失败'))
    document.body.appendChild(script)
  })
}

/** @param {HTMLElement | string} container */
export async function initCozeWebSdk(container) {
  const config = getCozeWebSdkConfig()
  const validationError = validateCozeWebSdkConfig(config)
  if (validationError) {
    throw new Error(validationError)
  }

  if (!container) {
    throw new Error('Coze Web SDK 缺少挂载容器')
  }

  const sdk = await loadCozeWebSdkScript()

  if (initialized && sdk.destroy) {
    sdk.destroy()
    initialized = false
  }

  sdk.init({
    container,
    projectId: config.projectId,
    refreshToken: () => Promise.resolve(config.token),
  })

  initialized = true
  return sdk
}

export function destroyCozeWebSdk() {
  if (window.cozeWebSDK?.destroy) {
    window.cozeWebSDK.destroy()
  }
  initialized = false
}
