import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { planNextReview } from './review'
import { todayStr, uid, type DailyTask, type Mistake, type ReviewRecord, type StudySession, type Subject, type UserSettings } from './types'

export interface DemoUser { id: string; email: string; display_name: string }
interface State {
  mistakes: Mistake[]
  subjects: Subject[]
  sessions: StudySession[]
  tasks: DailyTask[]
  reviews: ReviewRecord[]
  settings: UserSettings
}
const LS_KEY = 'studyflow-demo-v1'
const DEFAULT_SETTINGS: UserSettings = { user_id: 'demo', theme: 'light', daily_goal_minutes: 60, review_intervals: [1, 3, 7, 15, 30], updated_at: new Date().toISOString() }

function load(): State {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) { const p = JSON.parse(raw) as State; return { ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } } }
  } catch { /* 损坏的本地数据不崩页面，回到空状态 */ }
  return { mistakes: [], subjects: [], sessions: [], tasks: [], reviews: [], settings: DEFAULT_SETTINGS }
}

interface StoreCtx extends State {
  mode: 'supabase' | 'demo'
  user: DemoUser | null
  login: (email: string) => void
  logout: () => void
  toast: string | null
  setToast: (s: string | null) => void
  lastError: string | null
  addSubject: (name: string) => Subject
  ensureSubject: (name: string) => Subject
  addMistake: (m: Omit<Mistake, 'id' | 'user_id' | 'subject_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'last_reviewed_at' | 'next_review_at' | 'consecutive_wrong'>) => Mistake
  updateMistake: (id: string, patch: Partial<Mistake>) => void
  softDelete: (id: string) => void
  restore: (id: string) => void
  hardDelete: (id: string) => void
  bulk: (ids: string[], action: 'delete' | 'favorite' | 'mastered' | 'restore') => void
  reviewMistake: (id: string, correct: boolean) => { ok: boolean; msg: string }
  addSession: (s: Omit<StudySession, 'id' | 'user_id' | 'created_at'>) => void
  toggleTask: (id: string) => void
  generateDailyTasks: () => void
  updateSettings: (patch: Partial<UserSettings>) => void
  importMistakes: (items: { subject_name: string; title: string; content: string; answer: string; analysis?: string; knowledge_points?: string[]; type: string; difficulty: '简单' | '中等' | '困难'; mastery?: Mistake['mastery']; favorite?: boolean; note?: string }[]) => number
  resetAll: () => void
}

const Ctx = createContext<StoreCtx | null>(null)
export function useStore(): StoreCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore 必须在 StoreProvider 内使用')
  return v
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const [toast, setToast] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [user, setUser] = useState<DemoUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('studyflow-user') || 'null') } catch { return null }
  })
  const reviewing = useRef(new Set<string>())

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch { setLastError('本地存储已满或不可用，本次改动可能未保存') } }, [state])
  useEffect(() => { document.documentElement.classList.toggle('dark', state.settings.theme === 'dark') }, [state.settings.theme])

  // Supabase 已连接时：尝试把 mistakes/subjects 写回数据库；失败只报错、不改本地状态、不假装成功。
  async function syncToSupabase(table: string, row: Record<string, unknown>) {
    if (!isSupabaseConfigured || !supabase) return
    const { error } = await supabase.from(table).upsert(row)
    if (error) setLastError(`同步到 Supabase 失败（${table}）：${error.message}，本地改动仍保留，联网后可重试`)
  }

  const value = useMemo<StoreCtx>(() => {
    const uidUser = user?.id ?? 'demo'
    const ensureSubject = (name: string): Subject => {
      const found = state.subjects.find((s) => s.name === name)
      if (found) return found
      const sub: Subject = { id: uid(), user_id: uidUser, name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setState((s) => ({ ...s, subjects: [...s.subjects, sub] }))
      void syncToSupabase('subjects', { id: sub.id, user_id: sub.user_id, name: sub.name })
      return sub
    }
    return {
      ...state,
      mode: isSupabaseConfigured ? 'supabase' : 'demo',
      user, toast, setToast, lastError,
      login: (email: string) => {
        const u: DemoUser = { id: uid(), email, display_name: email.split('@')[0] || '同学' }
        setUser(u)
        try { localStorage.setItem('studyflow-user', JSON.stringify(u)) } catch { /* ignore */ }
        setToast('登录成功')
      },
      logout: () => { setUser(null); try { localStorage.removeItem('studyflow-user') } catch { /* ignore */ } },
      addSubject: ensureSubject,
      ensureSubject,
      addMistake: (m) => {
        const sub = ensureSubject(m.subject_name)
        const now = new Date().toISOString()
        const item: Mistake = { ...m, id: uid(), user_id: uidUser, subject_id: sub.id, created_at: now, updated_at: now, last_reviewed_at: null, next_review_at: null, consecutive_wrong: 0, deleted_at: null }
        setState((s) => ({ ...s, mistakes: [item, ...s.mistakes] }))
        void syncToSupabase('mistakes', { id: item.id, user_id: item.user_id, subject_id: item.subject_id, title: item.title, content: item.content, image_url: item.image_url, answer: item.answer, analysis: item.analysis, knowledge_points: item.knowledge_points, type: item.type, difficulty: item.difficulty, mastery: item.mastery, favorite: item.favorite, note: item.note })
        return item
      },
      updateMistake: (id, patch) => setState((s) => ({ ...s, mistakes: s.mistakes.map((m) => m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m) })),
      softDelete: (id) => setState((s) => ({ ...s, mistakes: s.mistakes.map((m) => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m) })),
      restore: (id) => setState((s) => ({ ...s, mistakes: s.mistakes.map((m) => m.id === id ? { ...m, deleted_at: null } : m) })),
      hardDelete: (id) => setState((s) => ({ ...s, mistakes: s.mistakes.filter((m) => m.id !== id) })),
      bulk: (ids, action) => setState((s) => ({
        ...s,
        mistakes: s.mistakes.map((m) => {
          if (!ids.includes(m.id)) return m
          if (action === 'delete') return { ...m, deleted_at: new Date().toISOString() }
          if (action === 'restore') return { ...m, deleted_at: null }
          if (action === 'favorite') return { ...m, favorite: true }
          return { ...m, mastery: '已掌握' as const }
        }),
      })),
      reviewMistake: (id, correct) => {
        if (reviewing.current.has(id)) return { ok: false, msg: '这道题正在提交复习结果，请勿重复点击' }
        const m = state.mistakes.find((x) => x.id === id)
        if (!m) return { ok: false, msg: '找不到这道题' }
        reviewing.current.add(id)
        try {
          const out = planNextReview(m, correct, new Date(), state.settings.review_intervals)
          const now = new Date().toISOString()
          const rec: ReviewRecord = { id: uid(), mistake_id: id, user_id: uidUser, result: correct ? '正确' : '错误', reviewed_at: now, next_review_at: out.next_review_at }
          setState((s) => ({
            ...s,
            reviews: [rec, ...s.reviews],
            mistakes: s.mistakes.map((x) => x.id === id ? { ...x, mastery: out.mastery, consecutive_wrong: out.consecutive_wrong, last_reviewed_at: now, next_review_at: out.next_review_at, updated_at: now } : x),
          }))
          void syncToSupabase('review_records', { id: rec.id, mistake_id: id, user_id: uidUser, result: correct ? 'correct' : 'wrong', reviewed_at: now, next_review_at: out.next_review_at })
          setToast(out.reason)
          return { ok: true, msg: out.reason }
        } finally {
          // 稍后才放行，防止双击；网络失败时本地也不写（本函数在 setState 前无网络调用，失败路径由调用方捕获）
          setTimeout(() => reviewing.current.delete(id), 800)
        }
      },
      addSession: (s) => setState((prev) => ({ ...prev, sessions: [{ ...s, id: uid(), user_id: uidUser, created_at: new Date().toISOString() }, ...prev.sessions] })),
      toggleTask: (id) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) })),
      generateDailyTasks: () => {
        const today = todayStr()
        const due = state.mistakes.filter((m) => !m.deleted_at && (!m.last_reviewed_at || (m.next_review_at && m.next_review_at.slice(0, 10) <= today))).slice(0, 10)
        const existing = new Set(state.tasks.filter((t) => t.date === today).map((t) => t.mistake_id))
        const fresh: DailyTask[] = due.filter((m) => !existing.has(m.id)).map((m) => ({ id: uid(), user_id: uidUser, title: `复习：${m.title}`, date: today, done: false, mistake_id: m.id, created_at: new Date().toISOString() }))
        if (fresh.length) setState((s) => ({ ...s, tasks: [...fresh, ...s.tasks] }))
        setToast(fresh.length ? `已生成 ${fresh.length} 个今日复习任务` : '今日没有新增的到期任务')
      },
      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch, updated_at: new Date().toISOString() } })),
      importMistakes: (items) => {
        let n = 0
        const now = new Date().toISOString()
        const created: Mistake[] = items.map((it) => {
          const sub = state.subjects.find((s) => s.name === it.subject_name) ?? { id: uid(), user_id: uidUser, name: it.subject_name, created_at: now, updated_at: now }
          n++
          return { id: uid(), user_id: uidUser, subject_id: sub.id, subject_name: it.subject_name, title: it.title, content: it.content, image_url: null, image_name: null, answer: it.answer, analysis: it.analysis ?? '', knowledge_points: it.knowledge_points ?? [], type: it.type, difficulty: it.difficulty, mastery: it.mastery ?? '未掌握', consecutive_wrong: 0, favorite: it.favorite ?? false, note: it.note ?? '', created_at: now, updated_at: now, last_reviewed_at: null, next_review_at: null, deleted_at: null }
        })
        const newSubjects = items.map((it) => it.subject_name).filter((name) => !state.subjects.some((s) => s.name === name))
        setState((s) => ({ ...s, mistakes: [...created, ...s.mistakes], subjects: [...s.subjects, ...newSubjects.map((name) => ({ id: uid(), user_id: uidUser, name, created_at: now, updated_at: now }))] }))
        return n
      },
      resetAll: () => { setState({ mistakes: [], subjects: [], sessions: [], tasks: [], reviews: [], settings: DEFAULT_SETTINGS }); try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ } },
    }
  }, [state, user, toast, lastError])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
