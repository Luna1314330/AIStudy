/** 将词库分组，供首页下拉选择使用 */
export function groupWordBooks(books) {
  const textbookBooks = books.filter((book) => book.type === 'textbook')
  const customBooks = books.filter((book) => book.type === 'custom')
  const groups = []

  const gradeMap = new Map()

  for (const book of textbookBooks) {
    const key =
      book.grade && book.term ? `${book.grade}-${book.term}` : 'special'
    if (!gradeMap.has(key)) {
      gradeMap.set(key, [])
    }
    gradeMap.get(key).push(book)
  }

  const gradeOrder = ['3-1', '4-1', 'special']
  const gradeLabels = {
    '3-1': '三年级上册',
    '4-1': '四年级上册',
    special: '专题词库',
  }

  const sortedKeys = [
    ...gradeOrder.filter((key) => gradeMap.has(key)),
    ...[...gradeMap.keys()].filter((key) => !gradeOrder.includes(key)).sort(),
  ]

  for (const key of sortedKeys) {
    const list = gradeMap.get(key) || []
    list.sort((a, b) => (a.unit || 0) - (b.unit || 0))
    groups.push({
      id: key,
      label: gradeLabels[key] || key,
      books: list,
    })
  }

  if (customBooks.length) {
    groups.push({
      id: 'custom',
      label: '自定义词库',
      books: customBooks,
    })
  }

  return groups
}

export function bookPickerLabel(book) {
  if (!book) return ''
  const parts = book.name.split('·').map((part) => part.trim())
  if (parts.length > 1) {
    return parts[parts.length - 1]
  }
  return book.name
}
