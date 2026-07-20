import kingdomData from './englishReadingKingdom.json'

export const ENGLISH_READING_KINGDOM = kingdomData

export function getGardenRegion() {
  return ENGLISH_READING_KINGDOM.regions.find((region) => region.id === 'garden') ?? null
}

export function getGardenSeries() {
  return getGardenRegion()?.series ?? []
}

export function getGardenBooks() {
  return getGardenSeries().flatMap((series) => series.books ?? [])
}

export const GARDEN_BOOK_COUNT = getGardenBooks().length

export function getGardenBook(id) {
  return getGardenBooks().find((book) => book.id === String(id)) ?? null
}

export function getRegionById(regionId) {
  return ENGLISH_READING_KINGDOM.regions.find((region) => region.id === regionId) ?? null
}

export function formatBookTitleCn(titleCn) {
  if (!titleCn) return ''
  const trimmed = titleCn.trim()
  if (trimmed.startsWith('《') && trimmed.endsWith('》')) return trimmed
  return `《${trimmed}》`
}

/** 例如：悠游阅读成长计划3—1 */
export function getBookSeriesLabel(bookId) {
  const context = getBookSeriesContext(bookId)
  return context?.label ?? ''
}

export function getBookSeriesContext(bookId) {
  const id = String(bookId)

  for (const series of getGardenSeries()) {
    for (const batch of series.batches ?? []) {
      if (!batch.books?.some((book) => book.id === id)) continue

      if (batch.label) {
        return {
          seriesName: series.seriesName,
          seriesLevel: series.seriesLevel,
          batchFolder: batch.folder,
          label: batch.label,
        }
      }

      const level = series.seriesLevel?.match(/第(\d+)级/)?.[1] ?? ''
      const batchNo = String(batch.folder ?? '').match(/_(\d+)$/)?.[1] ?? ''
      const label = batchNo ? `${series.seriesName}${level}—${batchNo}` : `${series.seriesName}${level}`

      return {
        seriesName: series.seriesName,
        seriesLevel: series.seriesLevel,
        batchFolder: batch.folder,
        label,
      }
    }
  }

  return null
}

/** 绘本在闯关顺序中的批次序号（0 = 第一个系列/批次） */
export function getBookBatchIndex(bookId) {
  const id = String(bookId)
  let batchIndex = 0

  for (const series of getGardenSeries()) {
    for (const batch of series.batches ?? []) {
      if (batch.books?.some((book) => book.id === id)) {
        return batchIndex
      }
      batchIndex += 1
    }
  }

  return null
}

export function getGardenBatchCount() {
  return getGardenSeries().reduce((sum, series) => sum + (series.batches?.length ?? 0), 0)
}

/** 抽卡权重：立方衰减 + 前 3 批额外加成，优先稳定推进前几批 */
export function getBookDrawWeight(bookId) {
  const batchIndex = getBookBatchIndex(bookId)
  const batchCount = getGardenBatchCount()
  if (batchIndex == null || batchCount <= 0) return 1

  const rank = batchCount - batchIndex
  let weight = rank ** 3

  if (batchIndex < 3) {
    weight *= 2
  }

  return Math.max(1, weight)
}
