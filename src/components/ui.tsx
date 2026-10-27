import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useStore } from '../lib/store'

export function ModeBanner() {
  const { mode } = useStore()
  if (mode === 'supabase') {
    return <div role="status" className="bg-emerald-600 text-white text-center text-xs px-3 py-2">已连接 Supabase：数据走数据库（公开 anon 密钥，不含服务端密钥）</div>
  }
  return <div role="status" className="bg-amber-500 text-white text-center text-xs px-3 py-2 font-medium">演示模式：未连接 Supabase，数据只存在本机浏览器</div>
}

export function Empty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Btn({ children, to, onClick, variant = 'primary', type }: { children: ReactNode; to?: string; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; type?: 'submit' | 'button' }) {
  const cls = variant === 'primary'
    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
    : variant === 'danger' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700'
  if (to) return <Link to={to} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium min-h-11 ${cls}`}>{children}</Link>
  return <button type={type ?? 'button'} onClick={onClick} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium min-h-11 ${cls}`}>{children}</button>
}

const MAIN_NAV = [
  { to: '/', label: '首页' },
  { to: '/mistakes', label: '错题' },
  { to: '/review', label: '复习' },
  { to: '/stats', label: '统计' },
  { to: '/more', label: '更多' },
]
const SIDE_NAV = [
  { to: '/', label: '首页仪表盘' }, { to: '/mistakes', label: '错题列表' }, { to: '/mistakes/new', label: '新增错题' },
  { to: '/stats', label: '学科统计' }, { to: '/knowledge', label: '知识点统计' }, { to: '/review', label: '复习计划' },
  { to: '/tasks', label: '每日任务' }, { to: '/calendar', label: '学习日历' }, { to: '/sessions', label: '学习记录' },
  { to: '/import-export', label: '数据导入导出' }, { to: '/settings', label: '个人设置' }, { to: '/admin', label: '管理与诊断' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { toast, setToast, lastError, user, logout } = useStore()
  const loc = useLocation()
  const isLogin = loc.pathname === '/login'
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ModeBanner />
      {lastError && <div role="alert" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs px-3 py-2 text-center">{lastError}</div>}
      <div className="mx-auto max-w-6xl md:flex">
        <aside className="hidden md:block w-56 shrink-0 p-4">
          <Link to="/" className="font-bold text-lg">📚 StudyFlow</Link>
          <nav aria-label="主导航" className="mt-4 space-y-1">
            {SIDE_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `block rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="mt-6 text-xs text-slate-500">{user ? <><p>{user.email}</p><button onClick={logout} className="mt-2 underline">退出登录</button></> : <Link to="/login" className="underline">去登录</Link>}</div>
        </aside>
        <main className="flex-1 min-w-0 px-3 pt-4 pb-24 md:pb-8 md:px-6">
          {!isLogin && <header className="md:hidden flex items-center justify-between mb-3"><Link to="/" className="font-bold">📚 StudyFlow</Link><Link to="/settings" className="text-sm underline">设置</Link></header>}
          {children}
        </main>
      </div>
      {!isLogin && (
        <nav aria-label="底部导航" className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {MAIN_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `py-2.5 text-center text-xs min-h-12 flex items-center justify-center ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>{n.label}</NavLink>
            ))}
          </div>
        </nav>
      )}
      {toast && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-8 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg max-w-[92vw] text-center">
          {toast} <button aria-label="关闭提示" onClick={() => setToast(null)} className="ml-2 underline">知道了</button>
        </div>
      )}
    </div>
  )
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-3"><h1 className="text-xl font-bold">{title}</h1>{sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}</div>
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 ${className}`}>{children}</section>
}
