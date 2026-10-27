export type Difficulty = '简单' | '中等' | '困难'
export type Mastery = '未掌握' | '部分掌握' | '已掌握'
export type MistakeType = string // 用户自定义，不写死

export interface Subject {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export interface Mistake {
  id: string
  user_id: string
  subject_id: string
  subject_name: string // 冗余展示字段，便于演示模式与导出；正式库以 subject_id 为准
  title: string
  content: string
  image_url?: string | null
  image_name?: string | null
  answer: string
  analysis: string
  knowledge_points: string[]
  type: string
  difficulty: Difficulty
  mastery: Mastery
  consecutive_wrong: number
  favorite: boolean
  note: string
  created_at: string
  updated_at: string
  last_reviewed_at: string | null
  next_review_at: string | null
  deleted_at: string | null
}

export interface ReviewRecord {
  id: string
  mistake_id: string
  user_id: string
  result: '正确' | '错误'
  reviewed_at: string
  next_review_at: string
  note?: string
}

export interface StudySession {
  id: string
  user_id: string
  title: string
  minutes: number
  date: string // YYYY-MM-DD
  created_at: string
}

export interface DailyTask {
  id: string
  user_id: string
  title: string
  date: string
  done: boolean
  mistake_id?: string | null
  created_at: string
}

export interface UserSettings {
  user_id: string
  theme: 'light' | 'dark'
  daily_goal_minutes: number
  review_intervals: number[] // 天数，例如 [1,3,7,15,30]
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export const DIFFICULTIES: Difficulty[] = ['简单', '中等', '困难']
export const MASTERIES: Mastery[] = ['未掌握', '部分掌握', '已掌握']

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
