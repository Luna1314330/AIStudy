const REGION_META = [
  {
    id: 'garden',
    order: 1,
    name: '初始台地',
    image: '/maps/1.jpg',
    superpower: '拼读感应',
    completeHint: '完成后你将获得「拼读感应」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'forest',
    order: 2,
    name: '溪流森林',
    image: '/maps/2.jpg',
    superpower: '语感细听',
    completeHint: '完成后你将获得「语感细听」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'canyon',
    order: 3,
    name: '巨石峡谷',
    image: '/maps/3.jpg',
    superpower: '句型拆解',
    completeHint: '完成后你将获得「句型拆解」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'volcano',
    order: 4,
    name: '火山地区',
    image: '/maps/4.jpg',
    superpower: '速读聚焦',
    completeHint: '完成后你将获得「速读聚焦」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'plateau',
    order: 5,
    name: '雷鸣高原',
    image: '/maps/5.jpg',
    superpower: '词汇联结',
    completeHint: '完成后你将获得「词汇联结」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'snowpeak',
    order: 6,
    name: '雪山之巅',
    image: '/maps/6.jpg',
    superpower: '深度理解',
    completeHint: '完成后你将获得「深度理解」超能力。进入下一张地图时，可以使用前面阶段已获得的超能力。',
  },
  {
    id: 'castle',
    order: 7,
    name: '终极城堡',
    image: '/maps/7.jpg',
    superpower: '阅读大师',
    completeHint: '完成终极城堡，集齐全部超能力，成为真正的阅读小达人！',
  },
]

/** 横向均匀分布 + 高低交替（间距适中，避免竖版卡片重叠） */
const WAVE_LAYOUT = [
  { x: 7, y: 33 },
  { x: 21, y: 61 },
  { x: 35, y: 33 },
  { x: 49, y: 61 },
  { x: 63, y: 33 },
  { x: 77, y: 61 },
  { x: 91, y: 47 },
]

/** 7 个区域：左 → 右，相邻节点上下错位 */
export const ENGLISH_MAP_REGIONS = REGION_META.map((region, index) => ({
  ...region,
  x: WAVE_LAYOUT[index].x,
  y: WAVE_LAYOUT[index].y,
  unlocked: region.id === 'garden',
}))

/** 沿节点坐标生成波浪形连接路径 */
export function buildMapCurvePath(regions = ENGLISH_MAP_REGIONS) {
  if (regions.length < 2) return ''

  const points = regions.map((r) => ({ x: r.x, y: r.y }))
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const curr = points[i]
    const cx = (prev.x + curr.x) / 2
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  return d
}
