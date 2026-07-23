import { useEffect, useMemo, useRef, useState } from 'react'
import { playShrineRevealDing, playShrineRevealSpin } from '@/utils/shrineRevealSound'
import './ShrineRewardReveal.css'

const TIMING = {
  enterToSpin: 520,
  spinToSettle: 2900,
  settleToDone: 4400,
  complete: 5400,
}

function RevealHeart({ className = '', filled = true, large = false }) {
  return (
    <span
      className={[
        'shrine-reveal__heart',
        filled ? 'shrine-reveal__heart--filled' : 'shrine-reveal__heart--empty',
        large && 'shrine-reveal__heart--large',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    />
  )
}

export default function ShrineRewardReveal({ visible, starsBefore, starsGained, onComplete }) {
  const [phase, setPhase] = useState('idle')
  const onCompleteRef = useRef(onComplete)
  const soundPlayedRef = useRef({ spin: false, ding: false })

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const starsAfter = starsBefore + starsGained

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        angle: index * 18,
        delay: index * 0.04,
      })),
    [],
  )

  useEffect(() => {
    if (!visible) {
      setPhase('idle')
      soundPlayedRef.current = { spin: false, ding: false }
      return undefined
    }

    setPhase('enter')
    const timers = [
      window.setTimeout(() => setPhase('spin'), TIMING.enterToSpin),
      window.setTimeout(() => setPhase('settle'), TIMING.spinToSettle),
      window.setTimeout(() => setPhase('done'), TIMING.settleToDone),
      window.setTimeout(() => {
        onCompleteRef.current?.()
      }, TIMING.complete),
    ]

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return undefined
    if (phase === 'spin' && !soundPlayedRef.current.spin) {
      soundPlayedRef.current.spin = true
      playShrineRevealSpin()
    }
    if (phase === 'settle' && !soundPlayedRef.current.ding) {
      soundPlayedRef.current.ding = true
      playShrineRevealDing()
    }
  }, [phase, visible])

  if (!visible && phase === 'idle') return null

  return (
    <div
      className={[
        'shrine-reveal',
        phase !== 'idle' && 'shrine-reveal--active',
        phase === 'spin' && 'shrine-reveal--spin',
        phase === 'settle' && 'shrine-reveal--settle',
        phase === 'done' && 'shrine-reveal--done',
      ]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      aria-hidden={phase === 'idle'}
    >
      <div className="shrine-reveal__backdrop" />

      <div className="shrine-reveal__content">
        <p className="shrine-reveal__eyebrow">Spirit Orb 祝福</p>
        <h2 className="shrine-reveal__title">神庙已点亮</h2>
        <p className="shrine-reveal__subtitle">获得 {starsGained} 颗星星</p>

        <div className="shrine-reveal__stage">
          <div className="shrine-reveal__aura" aria-hidden="true" />
          <div className="shrine-reveal__ring shrine-reveal__ring--outer" aria-hidden="true" />
          <div className="shrine-reveal__ring shrine-reveal__ring--inner" aria-hidden="true" />

          <div className="shrine-reveal__hearts-row" aria-label={`星星 ${starsAfter} 颗`}>
            {phase === 'settle' || phase === 'done' ? (
              <RevealHeart filled className="shrine-reveal__heart--new" />
            ) : (
              <RevealHeart filled={false} />
            )}
          </div>

          {(phase === 'enter' || phase === 'spin') && (
            <div className="shrine-reveal__orb-scene">
              <div className="shrine-reveal__orb-glow" />
              <div className="shrine-reveal__orb-heart-wrap">
                <RevealHeart large filled className="shrine-reveal__orb-heart" />
              </div>
            </div>
          )}

          <div className="shrine-reveal__particles" aria-hidden="true">
            {particles.map((particle) => (
              <span
                key={particle.id}
                className="shrine-reveal__particle"
                style={{
                  '--particle-angle': `${particle.angle}deg`,
                  '--particle-delay': `${particle.delay}s`,
                }}
              />
            ))}
          </div>
        </div>

        <p className="shrine-reveal__total">
          当前共 <strong>{starsAfter}</strong> 颗
        </p>
      </div>
    </div>
  )
}
