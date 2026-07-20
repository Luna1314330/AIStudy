import './SpatialCubeStack.css'

export default function SpatialCubeStack({ blocks, label }) {
  if (!blocks?.length) return null

  const layers = {}
  blocks.forEach((block) => {
    const layer = block.z ?? 0
    if (!layers[layer]) layers[layer] = []
    layers[layer].push(block)
  })

  const layerKeys = Object.keys(layers)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="spatial-stack-wrap">
      {label && <span className="spatial-stack-wrap__label">{label}</span>}
      <div className="spatial-stack">
        {layerKeys.map((layer) => (
          <div key={layer} className="spatial-stack__layer" style={{ zIndex: 10 - layer }}>
            <div className="spatial-stack__grid">
              {Array.from({ length: 9 }).map((_, index) => {
                const x = index % 3
                const y = Math.floor(index / 3)
                const filled = layers[layer].some((b) => b.x === x && b.y === y)
                return (
                  <div
                    key={`${layer}-${index}`}
                    className={`spatial-stack__cell${filled ? ' spatial-stack__cell--on' : ''}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
