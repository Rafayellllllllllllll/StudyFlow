import type { Mastery, Mistake } from './types'

export interface MistakeFilter {
  q: string
  subject: string // '' = 全部
  type: string
  difficulty: string
  knowledge: string
  mastery: string
  from: string // YYYY-MM-DD
  to: string
  onlyFavorite: boolean
  includeDeleted: boolean
}

export const EMPTY_FILTER: MistakeFilter = {
  q: '', subject: '', type: '', difficulty: '', knowledge: '', mastery: '',
  from: '', to: '', onlyFavorite: false, includeDeleted: false,
}

export function filterMistakes(list: Mistake[], f: MistakeFilter): Mistake[] {
  return list.filter((m) => {
    if (!f.includeDeleted && m.deleted_at) return false
    if (f.includeDeleted && !m.deleted_at) return false
    if (f.q) {
      const q = f.q.toLowerCase()
      const hay = `${m.title} ${m.content} ${m.answer} ${m.analysis} ${m.knowledge_points.join(' ')} ${m.note}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (f.subject && m.subject_name !== f.subject) return false
    if (f.type && m.type !== f.type) return false
    if (f.difficulty && m.difficulty !== f.difficulty) return false
    if (f.mastery && m.mastery !== f.mastery) return false
    if (f.knowledge && !m.knowledge_points.some((k) => k.includes(f.knowledge))) return false
    if (f.from && m.created_at.slice(0, 10) < f.from) return false
    if (f.to && m.created_at.slice(0, 10) > f.to) return false
    if (f.onlyFavorite && !m.favorite) return false
    return true
  })
}

export type SortKey = 'newest' | 'oldest' | 'dueFirst' | 'masteryAsc'

export function sortMistakes(list: Mistake[], key: SortKey): Mistake[] {
  const arr = [...list]
  if (key === 'newest') return arr.sort((a, b) => b.created_at.localeCompare(a.created_at))
  if (key === 'oldest') return arr.sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (key === 'dueFirst') {
    return arr.sort((a, b) => (a.next_review_at ?? '9999').localeCompare(b.next_review_at ?? '9999'))
  }
  const rank = (m: Mastery) => (m === '未掌握' ? 0 : m === '部分掌握' ? 1 : 2)
  return arr.sort((a, b) => rank(a.mastery) - rank(b.mastery) || b.created_at.localeCompare(a.created_at))
}

export function subjectStats(list: Mistake[], subjects: string[], from: string, to: string) {
  return subjects.map((name) => {
    const items = list.filter((m) => !m.deleted_at && m.subject_name === name && m.created_at.slice(0, 10) >= from && m.created_at.slice(0, 10) <= to)
    const now = new Date()
    const recentCut = new Date()
    recentCut.setDate(recentCut.getDate() - 7)
    return {
      name,
      total: items.length,
      unreviewed: items.filter((m) => !m.last_reviewed_at).length,
      mastered: items.filter((m) => m.mastery === '已掌握').length,
      recent: items.filter((m) => new Date(m.created_at) >= recentCut).length,
      due: items.filter((m) => m.next_review_at && new Date(m.next_review_at) <= now).length,
    }
  })
}
