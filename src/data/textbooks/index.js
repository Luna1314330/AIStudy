import { GRADE_3_UPPER } from './grade3-upper'
import { GRADE_4_UPPER } from './grade4-upper'

/** 易错词等专题词库（非按单元） */
const SPECIAL_BOOKS = [
  {
    id: 'book-error-prone',
    name: '易错词精选',
    type: 'textbook',
    words: [
      { word: '奥秘', pinyin: 'ào mì', example: '大自然有很多奥秘。' },
      { word: '谦虚', pinyin: 'qiān xū', example: '谦虚使人进步。' },
      { word: '姿势', pinyin: 'zī shì', example: '保持正确的读写姿势。' },
      { word: '覆盖', pinyin: 'fù gài', example: '大雪覆盖了大地。' },
      { word: '演奏', pinyin: 'yǎn zòu', example: '他在台上演奏钢琴。' },
      { word: '柔和', pinyin: 'róu hé', example: '月光柔和地洒进房间。' },
    ],
  },
]

/**
 * 汇总所有内置课本词库。
 * 新增年级：在 textbooks/ 下建 gradeX-*.js，在此 import 并 push 到 ALL_TEXTBOOKS。
 */
const ALL_TEXTBOOKS = [
  ...GRADE_3_UPPER,
  ...GRADE_4_UPPER,
  // import { GRADE_3_LOWER } from './grade3-lower'
  // ...GRADE_3_LOWER,
]

export const SAMPLE_WORD_BOOKS = [...ALL_TEXTBOOKS, ...SPECIAL_BOOKS]

export function getBuiltinTextbookBooks() {
  return SAMPLE_WORD_BOOKS.filter((book) => book.type === 'textbook')
}
