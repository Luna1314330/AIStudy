import { pinyin } from 'pinyin-pro'
import { SAMPLE_WORD_BOOKS } from '@/data/sampleWordBooks'

export function parseCommaWords(text) {
  return [
    ...new Set(
      text
        .split(/[,，、\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ]
}

export function wordsToCommaText(words) {
  return words.map((item) => (typeof item === 'string' ? item : item.word)).join('，')
}

export function generatePinyin(word) {
  try {
    const result = pinyin(word, { toneType: 'symbol', type: 'array' })
    return Array.isArray(result) ? result.join(' ') : ''
  } catch {
    return ''
  }
}

/** 内置词库与常见词语的标准例句 */
const KNOWN_EXAMPLES = Object.fromEntries(
  SAMPLE_WORD_BOOKS.flatMap((book) =>
    book.words.map((item) => [item.word, item.example])
  )
)

Object.assign(KNOWN_EXAMPLES, {
  山坡: '山坡上开满了五颜六色的野花。',
  学校: '同学们在学校里认真学习。',
  飘扬: '五星红旗在天空中飘扬。',
  课文: '今天我们要朗读这篇课文。',
  声音: '悦耳的声音从远处传来。',
  热闹: '春节的街上十分热闹。',
  粗壮: '这棵松树有着粗壮的树干。',
  洁白: '洁白的雪花铺满了地面。',
  秋风: '秋风吹拂着金色的稻田。',
  门板: '风一吹，门板轻轻晃动。',
  国旗: '鲜艳的国旗在旗杆上升起。',
  敬礼: '少先队员向国旗敬礼。',
  招引: '花香招引来了许多蜜蜂。',
  枝干: '梧桐树有粗壮的枝干。',
  白桦: '白桦树在林子里显得格外挺拔。',
})

const PLACE_CHARS = '校园场街坡山湖城村室馆店路市县区镇门'
const NATURE_CHARS = '风雨雪云雷阳光月'
const ABSTRACT_CHARS = '声音课文诗词话语思想感情'
const ADJECTIVE_CHARS = '洁亮艳丽净强弱粗细高低壮闹柔暖清凉'
const VERB_CHARS = '扬摆动跑走吃喝说看读写打玩跳唱画'
const OBJECT_CHARS = '手脚眼耳头脸口鼻板窗桌椅书本笔'

function hashWord(word) {
  return [...word].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function classifyWord(word) {
  if (KNOWN_EXAMPLES[word]) return 'known'

  const last = word[word.length - 1]
  const chars = [...word].join('')

  if ([...PLACE_CHARS].some((char) => chars.includes(char))) return 'place'
  if ([...NATURE_CHARS].some((char) => chars.includes(char))) return 'nature'
  if ([...ABSTRACT_CHARS].some((char) => chars.includes(char))) return 'abstract'
  if (word.length >= 2 && [...ADJECTIVE_CHARS].includes(last)) return 'adjective'
  if (word.length >= 2 && [...VERB_CHARS].includes(last)) return 'verb'
  if ([...OBJECT_CHARS].some((char) => chars.includes(char))) return 'object'

  return 'general'
}

const CATEGORY_TEMPLATES = {
  place: [
    (word) => `${word}上开满了五颜六色的野花。`,
    (word) => `同学们在${word}里认真学习。`,
    (word) => `远处的${word}显得格外美丽。`,
    (word) => `清晨，阳光照在${word}上。`,
  ],
  nature: [
    (word) => `${word}吹拂着金色的稻田。`,
    (word) => `${word}过后，空气格外清新。`,
    (word) => `${word}轻轻掠过树梢。`,
    (word) => `${word}给大地带来了新的变化。`,
  ],
  abstract: [
    (word) => `${word}在教室里回荡。`,
    (word) => `今天我们要朗读这篇${word}。`,
    (word) => `他仔细聆听着${word}。`,
    (word) => `${word}让人印象深刻。`,
  ],
  adjective: [
    (word) => `${word}的雪花铺满了地面。`,
    (word) => `这棵树的枝干十分${word}。`,
    (word) => `节日里，街上十分${word}。`,
    (word) => `同学们穿着${word}的校服。`,
  ],
  verb: [
    (word) => `五星红旗在天空中${word}。`,
    (word) => `小鸟在枝头快乐地${word}。`,
    (word) => `同学们在操场上${word}。`,
    (word) => `微风吹过，彩旗轻轻${word}。`,
  ],
  object: [
    (word) => `${word}被风吹得轻轻晃动。`,
    (word) => `${word}放在桌子上一尘不染。`,
    (word) => `他轻轻推开了${word}。`,
    (word) => `${word}在阳光下闪闪发亮。`,
  ],
  general: [
    (word) => `关于${word}，同学们展开了热烈的讨论。`,
    (word) => `${word}给这件事增添了新的色彩。`,
    (word) => `我在日记里写到了${word}。`,
    (word) => `${word}让我想起了美好的往事。`,
  ],
}

function pickTemplate(word, category) {
  const templates = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.general
  return templates[hashWord(word) % templates.length](word)
}

export function generateExample(word) {
  if (KNOWN_EXAMPLES[word]) {
    return KNOWN_EXAMPLES[word]
  }

  const category = classifyWord(word)
  if (category === 'known') {
    return KNOWN_EXAMPLES[word]
  }

  return pickTemplate(word, category)
}

export function enrichWord(word, previous, { refreshExamples = false } = {}) {
  if (previous && previous.word === word) {
    return {
      word,
      pinyin: previous.pinyin || generatePinyin(word),
      example: refreshExamples
        ? generateExample(word)
        : previous.example || generateExample(word),
    }
  }

  return {
    word,
    pinyin: generatePinyin(word),
    example: generateExample(word),
  }
}

export function buildWordEntries(rawText, previousEntries = [], options = {}) {
  const words = parseCommaWords(rawText)
  const previousMap = new Map(previousEntries.map((item) => [item.word, item]))

  return words.map((word) => enrichWord(word, previousMap.get(word), options))
}
