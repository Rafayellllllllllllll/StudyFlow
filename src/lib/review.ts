import { addDays } from './types'
import type { Mastery, Mistake } from './types'

/**
 * 可解释的间隔复习策略（初始版本，非医学/教育学验证的最佳算法）。
 * 规则说明（界面会同步展示）：
 * - 从未复习：首次复习安排在 1 天后。
 * - 答对：掌握程度上升一档，间隔按配置表向后取一格（已掌握后取最大间隔）。
 * - 答错：连续答错 +1，掌握程度回落到「未掌握」，下次复习缩短为 1 天后。
 * - 已掌握且答对：不再频繁打扰，取配置的最大间隔。
 * - 手动改日期：调用方直接写入 next_review_at，本函数不覆盖手动值。
 * - 重复提交：调用方用 reviewed_at + mistake_id 去重（见 store 的 review 一次性令牌），
 *   本纯函数本身无副作用，可重复调用得到同一结果。
 * - 网络失败：调用方不写库、不更新下次日期，失败时提示重试（见 UI）。
 */
export const DEFAULT_INTERVALS = [1, 3, 7, 15, 30]

export function masteryStep(mastery: Mastery): number {
  if (mastery === '未掌握') return 0
  if (mastery === '部分掌握') return 1
  return 2
}

export function nextMastery(current: Mastery, correct: boolean): Mastery {
  if (!correct) return '未掌握'
  if (current === '未掌握') return '部分掌握'
  return '已掌握'
}

export interface ReviewOutcome {
  mastery: Mastery
  consecutive_wrong: number
  next_review_at: string
  interval_days: number
  reason: string
}

export function planNextReview(
  m: Pick<Mistake, 'mastery' | 'consecutive_wrong' | 'last_reviewed_at'>,
  correct: boolean,
  now: Date = new Date(),
  intervals: number[] = DEFAULT_INTERVALS,
): ReviewOutcome {
  const safe = intervals.length > 0 ? intervals : DEFAULT_INTERVALS
  if (!correct) {
    return {
      mastery: '未掌握',
      consecutive_wrong: m.consecutive_wrong + 1,
      next_review_at: addDays(now.toISOString(), 1),
      interval_days: 1,
      reason: '答错：掌握程度回落到未掌握，连续答错 +1，1 天后重新复习。',
    }
  }
  if (!m.last_reviewed_at) {
    const days = safe[0]
    return {
      mastery: '部分掌握',
      consecutive_wrong: 0,
      next_review_at: addDays(now.toISOString(), days),
      interval_days: days,
      reason: `首次复习答对：从未复习改为部分掌握，${days} 天后复习。`,
    }
  }
  // 已掌握且答对：直接取最大间隔，不再按步进取中间值
  const step = masteryStep(m.mastery)
  const nextStep = Math.min(step + 1, safe.length - 1)
  const days = m.mastery === '已掌握' ? safe[safe.length - 1] : safe[nextStep]
  const nm = nextMastery(m.mastery, true)
  return {
    mastery: nm,
    consecutive_wrong: 0,
    next_review_at: addDays(now.toISOString(), days),
    interval_days: days,
    reason:
      nm === '已掌握'
        ? `答对且已掌握：取最大间隔 ${days} 天，避免频繁打扰。`
        : `答对：掌握程度提升为${nm}，${days} 天后复习。`,
  }
}

export type ReviewBucket = '未复习' | '已到期' | '连续答错' | '已掌握' | '未到期'

export function reviewBucket(m: Mistake, now: Date = new Date()): ReviewBucket {
  if (m.mastery === '已掌握' && m.consecutive_wrong === 0) return '已掌握'
  if (m.consecutive_wrong >= 2) return '连续答错'
  if (!m.last_reviewed_at) return '未复习'
  if (m.next_review_at && new Date(m.next_review_at) <= now) return '已到期'
  return '未到期'
}

export const REVIEW_EXPLAIN =
  '复习逻辑说明：本应用使用可配置的间隔策略（默认 1、3、7、15、30 天），答对延长间隔、答错缩短为 1 天、连续答错优先排前面。这只是初始版本的安排规则，不是经过医学或教育学验证的最佳算法，你可以在个人设置里改间隔，也可以在复习计划里手动改任意一题的下次复习日期。'
