import { useEffect, useRef } from 'react'
import { destroyCozeWebSdk, initCozeWebSdk } from '@/utils/cozeWebSdk'
import './CozeWebSdk.css'

export default function CozeWebSdk() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    initCozeWebSdk(container).catch((err) => {
      console.error('[Coze Web SDK]', err)
    })

    return () => {
      destroyCozeWebSdk()
    }
  }, [])

  return <div ref={containerRef} className="coze-web-sdk-container" />
}
