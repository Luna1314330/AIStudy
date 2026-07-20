/** 数学脑力地图 · 项目与 Boss 配置 */

export const MATH_PASS_ACCURACY = 0.8

export const MATH_SUPER_POWERS = {
  'speed-sense': {
    id: 'speed-sense',
    name: '速算感应',
    description: '60 秒挑战额外增加 5 秒',
  },
  'calc-vision': {
    id: 'calc-vision',
    name: '运算透视',
    description: '24 点 / 四则混合每局可多看 1 次运算提示（不直接给答案）',
  },
  'logic-shield': {
    id: 'logic-shield',
    name: '逻辑护盾',
    description: '数独挑战每局可容错 1 次，不中断连闯',
  },
  'space-intuition': {
    id: 'space-intuition',
    name: '空间直觉',
    description: '旋转/镜像题每局可额外预览 1 次变换效果',
  },
}

export const MATH_PROJECTS = [
  {
    id: 'speed',
    order: 1,
    name: '速算擂台',
    icon: '⚡',
    path: '/math/speed',
    superpowerId: 'speed-sense',
    superpowerLabel: '速算感应',
    unlocked: true,
    bossAfter: false,
  },
  {
    id: 'twentyfour',
    order: 2,
    name: '24 点实验室',
    icon: '🃏',
    path: '/math/twentyfour',
    superpowerId: 'calc-vision',
    superpowerLabel: '运算透视',
    unlocked: false,
    bossAfter: false,
  },
  {
    id: 'boss-1',
    order: 3,
    name: '混合 Boss',
    icon: '👑',
    path: '/math/boss/1',
    isBoss: true,
    unlocked: false,
    requiresProjects: ['speed', 'twentyfour'],
  },
  {
    id: 'mixed',
    order: 4,
    name: '四则混合',
    icon: '🧮',
    path: '/math/mixed',
    superpowerId: 'calc-vision',
    superpowerLabel: '运算透视',
    unlocked: false,
    bossAfter: false,
  },
  {
    id: 'sudoku',
    order: 5,
    name: '简单数独',
    icon: '🔢',
    path: '/math/sudoku',
    superpowerId: 'logic-shield',
    superpowerLabel: '逻辑护盾',
    unlocked: false,
    bossAfter: false,
  },
  {
    id: 'boss-2',
    order: 6,
    name: '逻辑 Boss',
    icon: '👑',
    path: '/math/boss/2',
    isBoss: true,
    unlocked: false,
    requiresProjects: ['mixed', 'sudoku'],
  },
  {
    id: 'spatial',
    order: 7,
    name: '空间挑战',
    icon: '🧊',
    path: '/math/spatial',
    superpowerId: 'space-intuition',
    superpowerLabel: '空间直觉',
    unlocked: false,
    bossAfter: false,
  },
]

/** 周一～周日 · 今日最强大脑题型 */
export const DAILY_BRAIN_SCHEDULE = [
  { day: 1, label: '周一', type: 'speed', title: '速算擂台' },
  { day: 2, label: '周二', type: 'twentyfour', title: '24 点实验室' },
  { day: 3, label: '周三', type: 'mixed', title: '四则混合' },
  { day: 4, label: '周四', type: 'sudoku', title: '简单数独' },
  { day: 5, label: '周五', type: 'spatial', title: '空间挑战' },
  { day: 6, label: '周六', type: 'speed', title: '速算 + 估算' },
  { day: 0, label: '周日', type: 'boss', title: '综合 Boss 复习' },
]

export const SPEED_CHAMPION = {
  id: 'flash-calc',
  name: '闪电小算',
  avatar: '⚡',
  intro: '我是闪电小算！连闯五关，才能攻擂成功！',
  win: '厉害！这一擂被你拿下啦！',
  lose: '别灰心，再练几题来挑战我！',
  wrong: '不对哦，冷静想想再选～',
  unsure: '不确定就稳一点，下一题加油！',
}

export const SUDOKU_GUARDIAN = {
  id: 'grid-sage',
  name: '格子博士',
  avatar: '🧩',
  intro: '我是格子博士！把空格填满，行列宫格都不能重复哦～',
  win: '逻辑满分！这一格被你攻破了！',
  lose: '别慌，再练一局，规律就在格子之间！',
  wrong: '这个数字和同行、同列或同宫冲突啦～',
  streakIntro: '连闯三局挑战，才能点亮数独岛！',
  streakWin: '三局连破！逻辑护盾到手！',
  streakLose: '连闯中断啦，稳住再试！',
}

export const TWENTYFOUR_DEALER = {
  id: 'card-mage',
  name: '扑克法师',
  avatar: '🃏',
  intro: '我是扑克法师！四张牌各用一次，算出 24 就赢～',
  win: '漂亮！24 点被你攻破了！',
  lose: '别急，换种运算顺序再试试！',
  wrong: '这步算完离 24 还远呢～',
  streakIntro: '连闯五题挑战，才能点亮 24 点实验室！',
  streakWin: '五题连破！运算透视到手！',
  streakLose: '连闯中断啦，再练几题！',
}

export const MIXED_MENTOR = {
  id: 'mix-master',
  name: '混合小师傅',
  avatar: '🧮',
  intro: '我是混合小师傅！乘除优先、括号先行，四则混合要稳准快～',
  win: '漂亮！这一组混合运算全拿下了！',
  lose: '别慌，看清运算顺序再试一次！',
  wrong: '运算顺序搞错啦，再想想～',
  streakIntro: '连闯五题全对，才能点亮四则混合岛！',
  streakWin: '五题连破！运算透视到手！',
  streakLose: '连闯中断啦，稳住顺序再挑战！',
}

export const SPATIAL_GUIDE = {
  id: 'cube-guide',
  name: '立方小探',
  avatar: '🧊',
  intro: '我是立方小探！先在脑子里转一转、翻一翻，空间题就不怕啦～',
  win: '空间感满分！这一组被你拿下了！',
  lose: '别急，换个角度再看看图形！',
  wrong: '再想想旋转或层数，差一点点～',
  streakIntro: '连闯三题全对，才能点亮空间挑战岛！',
  streakWin: '三题连破！空间直觉到手！',
  streakLose: '连闯中断啦，稳住再来！',
}

export function getDailyBrainEntry(date = new Date()) {
  const day = date.getDay()
  return DAILY_BRAIN_SCHEDULE.find((item) => item.day === day) ?? DAILY_BRAIN_SCHEDULE[0]
}

export function getProjectById(id) {
  return MATH_PROJECTS.find((item) => item.id === id) ?? null
}

/** 脑力地图节点坐标（百分比） */
export const MATH_MAP_NODES = [
  { id: 'speed', x: 8, y: 72 },
  { id: 'twentyfour', x: 22, y: 48 },
  { id: 'boss-1', x: 36, y: 68 },
  { id: 'mixed', x: 50, y: 42 },
  { id: 'sudoku', x: 64, y: 62 },
  { id: 'boss-2', x: 78, y: 38 },
  { id: 'spatial', x: 92, y: 58 },
]

export function buildMathMapCurvePath() {
  const points = MATH_MAP_NODES.map((node) => `${node.x},${node.y}`)
  return `M ${points.join(' L ')}`
}
