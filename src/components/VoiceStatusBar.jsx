import './VoiceStatusBar.css'

export default function VoiceStatusBar({ active }) {
  if (!active) return null

  return (
    <div className="voice-status" role="status" aria-live="polite">
      <span className="voice-status__dot" />
      <span className="voice-status__text">正在聆听… 说完请点击麦克风结束，再点发送</span>
    </div>
  )
}
