import { describe, expect, it } from 'vitest'
import { planNextReview, reviewBucket, nextMastery } from './review'
import type { Mistake } from './types'

const base = { mastery: '未掌握', consecutive_wrong: 0, last_reviewed_at: null } as Pick<Mistake, 'mastery' | 'consecutive_wrong' | 'last_reviewed_at'>
const now = new Date('2026-10-27T00:00:00.000Z')

describe('间隔复习算法', () => {
  it('从未复习且答对：1 天后复习，变为部分掌握', () => {
    const out = planNextReview(base, true, now)
    expect(out.mastery).toBe('部分掌握')
    expect(out.interval_days).toBe(1)
    expect(out.next_review_at.slice(0, 10)).toBe('2026-10-28')
  })
  it('答错：回落未掌握、连续答错 +1、1 天后复习', () => {
    const out = planNextReview({ ...base, mastery: '部分掌握', last_reviewed_at: '2026-10-20T00:00:00.000Z' }, false, now)
    expect(out.mastery).toBe('未掌握')
    expect(out.consecutive_wrong).toBe(1)
    expect(out.interval_days).toBe(1)
  })
  it('已掌握且答对：取最大间隔 30 天', () => {
    const out = planNextReview({ mastery: '已掌握', consecutive_wrong: 0, last_reviewed_at: '2026-10-20T00:00:00.000Z' }, true, now)
    expect(out.mastery).toBe('已掌握')
    expect(out.interval_days).toBe(30)
  })
  it('纯函数可重复调用结果一致（防重复提交语义）', () => {
    expect(planNextReview(base, true, now)).toEqual(planNextReview(base, true, now))
  })
  it('分桶：连续答错优先于已到期', () => {
    const m = { mastery: '未掌握', consecutive_wrong: 2, last_reviewed_at: '2026-10-01T00:00:00.000Z', next_review_at: '2026-10-02T00:00:00.000Z' } as Mistake
    expect(reviewBucket(m, now)).toBe('连续答错')
  })
  it('nextMastery：答对逐档上升，答错直接回未掌握', () => {
    expect(nextMastery('未掌握', true)).toBe('部分掌握')
    expect(nextMastery('已掌握', false)).toBe('未掌握')
  })
})
