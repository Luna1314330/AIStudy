import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildMapCurvePath,
  ENGLISH_MAP_REGIONS,
} from '@/data/englishMapRegions'
import './EnglishHome.css'

export default function EnglishHome() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(ENGLISH_MAP_REGIONS[0]?.id)
  const [imageErrors, setImageErrors] = useState(() => new Set())

  const pathD = useMemo(() => buildMapCurvePath(), [])
  const activeRegion =
    ENGLISH_MAP_REGIONS.find((r) => r.id === activeId) ?? ENGLISH_MAP_REGIONS[0]

  function handleImageError(id) {
    setImageErrors((prev) => new Set(prev).add(id))
  }

  function handleRegionClick(region) {
    setActiveId(region.id)
    if (region.unlocked) {
      navigate('/english/garden')
    }
  }

  return (
    <div className="english-home">
      <header className="english-home__header">
        <div>
          <h2 className="english-home__title">英语大冒险</h2>
          <p className="english-home__desc">
            从初始台地出发，自左向右闯关至终极城堡
          </p>
        </div>
        {activeRegion && (
          <div className="english-home__active">
            <div className="english-home__active-col">
              <span className="english-home__active-label">当前区域</span>
              <strong>{activeRegion.name}</strong>
            </div>
            <div className="english-home__active-col">
              <p
                className={`english-home__active-reward${activeRegion.unlocked ? '' : ' english-home__active-reward--locked'}`}
              >
                完成可获得
                <br />
                <span className="english-home__active-power">「{activeRegion.superpower}」</span>
                超能力
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="english-home__map-wrap">
        <div className="english-map">
          <div className="english-map__stage" role="img" aria-label="英语闯关地图">
            <svg
              className="english-map__curve"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={pathD} className="english-map__curve-shadow" />
              <path d={pathD} className="english-map__curve-line" />
            </svg>

            {ENGLISH_MAP_REGIONS.map((region) => {
              const isActive = region.id === activeId
              const imageFailed = imageErrors.has(region.id)
              const isLocked = !region.unlocked

              return (
                <button
                  key={region.id}
                  type="button"
                  className={[
                    'english-map__node',
                    isActive && 'english-map__node--active',
                    isLocked && 'english-map__node--locked',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  onClick={() => handleRegionClick(region)}
                  disabled={isLocked}
                  aria-label={`第 ${region.order} 关：${region.name}${isLocked ? '（未开放）' : ''}`}
                  aria-pressed={isActive}
                >
                  {isLocked && <span className="english-map__node-lock" aria-hidden="true">🔒</span>}
                  <span className="english-map__node-badge">{region.order}</span>
                  <span className="english-map__node-thumb">
                    {!imageFailed ? (
                      <img
                        src={region.image}
                        alt=""
                        loading="lazy"
                        onError={() => handleImageError(region.id)}
                      />
                    ) : (
                      <span className="english-map__node-fallback" aria-hidden="true">
                        {region.name.slice(0, 2)}
                      </span>
                    )}
                  </span>
                  <span className="english-map__node-name">{region.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className="english-home__tip">目前仅开放「初始台地」，点击进入 72 座绘本神庙</p>
    </div>
  )
}
