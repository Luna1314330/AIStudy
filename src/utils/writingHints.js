const STARTER_HINTS = [
  '我想写一篇关于春天的作文',
  '帮我构思「难忘的一天」',
  '我不知道怎么开头，题目是「我的好朋友」',
]

const KEYWORD_RULES = [
  {
    keywords: ['大纲', '结构', '提纲', '框架', '段落'],
    label: '继续完善结构',
    hints: ['按这个大纲往下写', '帮我把每段扩写一下', '大纲还能再简化吗'],
  },
  {
    keywords: ['开头', '开篇', '起始', '第一段'],
    label: '打磨开头',
    hints: ['换一个开头试试', '开头能不能再生动一点', '给我一个开头示例'],
  },
  {
    keywords: ['结尾', '收束', '最后', '点题'],
    label: '完善结尾',
    hints: ['帮我想一个结尾', '结尾怎么点题更好', '换一个更有力的结尾'],
  },
  {
    keywords: ['例子', '事例', '素材', '细节', '描写'],
    label: '补充细节',
    hints: ['再举一个生活中的例子', '帮我把细节写具体', '这个例子怎么写进作文里'],
  },
  {
    keywords: ['修改', '润色', '改', '通顺', '词语'],
    label: '修改润色',
    hints: ['帮我把这段话改通顺', '有没有更合适的词', '再简洁一点'],
  },
  {
    keywords: ['题目', '立意', '主题', '中心'],
    label: '明确主题',
    hints: ['题目还能怎么取', '中心思想再明确一点', '这个立意会不会太大'],
  },
  {
    keywords: ['记叙', '叙事', '经过', '过程'],
    label: '写清经过',
    hints: ['帮我把经过写清楚', '这里怎么写更有画面感', '顺序要不要调整'],
  },
  {
    keywords: ['议论', '观点', '道理', '感想'],
    label: '深化议论',
    hints: ['观点怎么写得更自然', '帮我把道理和事例结合', '感想部分再深一点'],
  },
  {
    keywords: ['人物', '性格', '外貌', '动作', '语言'],
    label: '刻画人物',
    hints: ['人物描写再具体一点', '加一段对话试试', '怎么让人物更鲜活'],
  },
  {
    keywords: ['环境', '场景', '氛围', '景物'],
    label: '丰富场景',
    hints: ['环境描写怎么加进去', '帮我把场景写得更立体', '氛围还能怎么烘托'],
  },
]

const STAGE_HINTS = {
  early: {
    label: '刚开始构思',
    hints: ['我想补充一点背景', '能不能换个写作角度', '这个题目还可以写什么'],
  },
  mid: {
    label: '继续往下写',
    hints: ['帮我想下一段写什么', '衔接怎么更自然', '再给我一些具体建议'],
  },
  late: {
    label: '收尾与润色',
    hints: ['帮我串成一篇完整作文', '检查一下整体结构', '能不能再润色一下'],
  },
}

const FALLBACK_HINTS = ['我还有一点想法', '请继续引导我', '这里我还不太明白']

function countCompletedUserTurns(messages) {
  return messages.filter((msg) => msg.role === 'user' && msg.status === 'done').length
}

function getLastAssistantText(messages) {
  const last = [...messages]
    .reverse()
    .find(
      (msg) =>
        msg.role === 'assistant' &&
        msg.content &&
        !['loading', 'failed'].includes(msg.status)
    )
  return last?.content || ''
}

function getLastUserText(messages) {
  const last = [...messages]
    .reverse()
    .find((msg) => msg.role === 'user' && msg.status === 'done')
  return last?.content || ''
}

function matchKeywordRule(text) {
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule
    }
  }
  return null
}

function getStageKey(userTurns) {
  if (userTurns <= 1) return 'early'
  if (userTurns <= 3) return 'mid'
  return 'late'
}

/** 根据对话进度与最近回复，生成 3~4 条快捷提示 */
export function getWritingQuickHints(messages) {
  if (!messages.length) return STARTER_HINTS

  const userTurns = countCompletedUserTurns(messages)
  const contextText = `${getLastAssistantText(messages)}\n${getLastUserText(messages)}`
  const keywordRule = matchKeywordRule(contextText)
  const stage = STAGE_HINTS[getStageKey(userTurns)]

  const merged = [
    ...(keywordRule?.hints || []),
    ...stage.hints,
    ...FALLBACK_HINTS,
  ]

  return [...new Set(merged)].slice(0, 4)
}

/** 快捷提示区标题，随对话阶段变化 */
export function getHintStageLabel(messages) {
  if (!messages.length) return '试试这些开场'

  const userTurns = countCompletedUserTurns(messages)
  const contextText = `${getLastAssistantText(messages)}\n${getLastUserText(messages)}`
  const keywordRule = matchKeywordRule(contextText)

  if (keywordRule?.label) return keywordRule.label

  return STAGE_HINTS[getStageKey(userTurns)].label
}

export function getWelcomeHints() {
  return STARTER_HINTS
}
