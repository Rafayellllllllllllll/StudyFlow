import { describe, expect, it } from 'vitest'
import { EMPTY_FILTER, filterMistakes, sortMistakes, subjectStats } from './filters'
import type { Mistake } from './types'

function mk(over: Partial<Mistake>): Mistake {
  return { id: '1', user_id: 'u', subject_id: 's', subject_name: '数学', title: '题1', content: '内容', image_url: null, image_name: null, answer: 'A', analysis: '', knowledge_points: ['函数'], type: '选择题', difficulty: '中等', mastery: '未掌握', consecutive_wrong: 0, favorite: false, note: '', created_at: '2026-10-20T00:00:00.000Z', updated_at: '2026-10-20T00:00:00.000Z', last_reviewed_at: null, next_review_at: null, deleted_at: null, ...over } as Mistake
}
const list = [
  mk({ id: '1', subject_name: '数学', title: '二次函数', difficulty: '困难', mastery: '未掌握', created_at: '2026-10-20T00:00:00.000Z' }),
  mk({ id: '2', subject_name: '物理', title: '力学', type: '主观题', mastery: '已掌握', knowledge_points: ['力学'], created_at: '2026-10-25T00:00:00.000Z' }),
  mk({ id: '3', subject_name: '数学', title: '已删除的题', deleted_at: '2026-10-26T00:00:00.000Z' }),
]

describe('筛选与排序', () => {
  it('学科筛选只返回该学科，且默认排除已删除', () => {
    expect(filterMistakes(list, { ...EMPTY_FILTER, subject: '数学' }).map((m) => m.id)).toEqual(['1'])
  })
  it('搜索命中标题与知识点', () => {
    expect(filterMistakes(list, { ...EMPTY_FILTER, q: '力学' }).map((m) => m.id)).toEqual(['2'])
    expect(filterMistakes(list, { ...EMPTY_FILTER, knowledge: '函数' }).map((m) => m.id)).toEqual(['1'])
  })
  it('日期区间筛选按创建时间', () => {
    expect(filterMistakes(list, { ...EMPTY_FILTER, from: '2026-10-24', to: '2026-10-27' }).map((m) => m.id)).toEqual(['2'])
  })
  it('排序：未掌握在前、最新在前', () => {
    expect(sortMistakes(list.filter((m) => !m.deleted_at), 'masteryAsc')[0].id).toBe('1')
    expect(sortMistakes(list.filter((m) => !m.deleted_at), 'newest')[0].id).toBe('2')
  })
  it('学科统计：只统计传入的学科名，不凭空造学科', () => {
    const rows = subjectStats(list, ['数学'], '2026-10-01', '2026-10-27')
    expect(rows).toHaveLength(1)
    expect(rows[0].total).toBe(1)
    expect(rows[0].unreviewed).toBe(1)
  })
})
