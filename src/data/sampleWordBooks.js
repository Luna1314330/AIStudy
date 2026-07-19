/**
 * 内置课本词库入口（数据在 ./textbooks/ 按年级维护）
 *
 * 每个词库对象：
 * - id: 唯一标识，如 book-g3-u1（年级-册-单元）
 * - name: 显示名称，如「三年级上册 · 第1单元」
 * - type: 固定为 'textbook'（内置词库，可编辑词语，不可删除）
 * - grade / term / unit: 可选，便于排序和筛选
 * - words: [{ word, pinyin, example }, ...]
 */
export { SAMPLE_WORD_BOOKS, getBuiltinTextbookBooks } from './textbooks'
