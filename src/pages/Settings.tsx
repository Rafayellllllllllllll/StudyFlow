import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStore } from '../lib/store'
import { Card, PageTitle } from '../components/ui'
import { settingsSchema } from '../lib/validate'

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 min-h-11'

export default function Settings() {
  const { settings, updateSettings, subjects, mistakes, addSubject, user, logout, resetAll, setToast, mode } = useStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(settingsSchema), defaultValues: { daily_goal_minutes: settings.daily_goal_minutes, review_intervals: settings.review_intervals.join(',') } })
  return (
    <div className="space-y-3 max-w-2xl">
      <PageTitle title="个人设置" sub={`当前模式：${mode === 'demo' ? '演示模式（数据只在本机浏览器）' : 'Supabase 模式'} · 登录账号：${user?.email ?? '未登录'}`} />
      <Card>
        <h2 className="font-semibold mb-2">主题</h2>
        <div className="flex gap-2">
          <button className={`flex-1 rounded-xl py-2.5 min-h-11 border ${settings.theme === 'light' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''}`} onClick={() => updateSettings({ theme: 'light' })}>亮色</button>
          <button className={`flex-1 rounded-xl py-2.5 min-h-11 border ${settings.theme === 'dark' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''}`} onClick={() => updateSettings({ theme: 'dark' })}>暗色</button>
        </div>
      </Card>
      <Card>
        <form onSubmit={handleSubmit((d) => {
          const intervals = d.review_intervals.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0)
          if (!intervals.length) { setToast('间隔格式不对，例如 1,3,7,15,30'); return }
          updateSettings({ daily_goal_minutes: d.daily_goal_minutes, review_intervals: intervals }); setToast('设置已保存')
        })} className="space-y-2">
          <h2 className="font-semibold">学习目标与复习间隔</h2>
          <div><label className="text-sm" htmlFor="goal">每日学习目标（分钟）</label><input id="goal" type="number" className={inputCls} {...register('daily_goal_minutes')} />{errors.daily_goal_minutes && <p role="alert" className="text-xs text-red-600">{errors.daily_goal_minutes.message}</p>}</div>
          <div><label className="text-sm" htmlFor="intervals">复习间隔（天，逗号分隔）</label><input id="intervals" className={inputCls} placeholder="1,3,7,15,30" {...register('review_intervals')} />{errors.review_intervals && <p role="alert" className="text-xs text-red-600">{errors.review_intervals.message}</p>}</div>
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-3 min-h-12 text-sm font-medium">保存设置</button>
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">学科管理</h2>
        <p className="text-sm text-slate-500 mb-2">学科不在前端写死；新增错题时输入新学科名会自动出现在这里。下面是当前已有学科：</p>
        <ul className="space-y-1 text-sm">{subjects.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span className="text-slate-500">{mistakes.filter((m) => m.subject_name === s.name && !m.deleted_at).length} 道</span></li>)}</ul>
        {subjects.length === 0 && <p className="text-sm text-slate-500">还没有学科。</p>}
        <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = String(fd.get('name') || '').trim(); if (!name) { setToast('请填写学科名'); return } addSubject(name); setToast(`已添加学科 ${name}`); e.currentTarget.reset() }}>
          <input name="name" placeholder="新增学科名，例如：物理" className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 dark:bg-slate-900 dark:border-slate-700" />
          <button className="border rounded-xl px-4 py-2.5 text-sm shrink-0">添加学科</button>
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">账号与数据</h2>
        {user ? <button className="w-full border rounded-xl py-3 text-sm min-h-12" onClick={() => { logout(); setToast('已退出登录') }}>退出登录（{user.email}）</button> : <p className="text-sm text-slate-500">当前未登录，登录页可进入演示模式。</p>}
        <button className="w-full bg-red-600 text-white rounded-xl py-3 text-sm min-h-12 mt-2" onClick={() => { if (window.confirm('确认清空本机全部 StudyFlow 数据吗？此操作不可撤销，请先导出备份。')) { resetAll(); setToast('本机数据已清空') } }}>清空本机全部数据</button>
      </Card>
    </div>
  )
}
