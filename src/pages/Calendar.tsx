import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Card, PageTitle } from '../components/ui'
import { fmtDate, todayStr } from '../lib/types'

export default function CalendarPage() {
  const { sessions, tasks, mistakes } = useStore()
  const now = new Date()
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()])
  const [selected, setSelected] = useState(todayStr())
  const [y, m] = ym
  const first = new Date(y, m, 1)
  const startWeek = (first.getDay() + 6) % 7 // 周一起始
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = useMemo(() => {
    const arr: (string | null)[] = Array(startWeek).fill(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    return arr
  }, [y, m, startWeek, daysInMonth])
  const daySessions = sessions.filter((s) => s.date === selected)
  const dayTasks = tasks.filter((t) => t.date === selected)
  const dayDue = mistakes.filter((mm) => !mm.deleted_at && mm.next_review_at?.slice(0, 10) === selected)
  const hasMark = (d: string) => sessions.some((s) => s.date === d) || tasks.some((t) => t.date === d) || mistakes.some((mm) => mm.next_review_at?.slice(0, 10) === d)
  const shift = (delta: number) => { const d = new Date(y, m + delta, 1); setYm([d.getFullYear(), d.getMonth()]) }

  return (
    <div className="space-y-3">
      <PageTitle title="学习日历" sub="有学习记录、任务或到期复习的日期会打点；点日期查看当天详情。" />
      <Card>
        <div className="flex items-center justify-between mb-2">
          <button className="border rounded-lg px-3 py-2 text-sm" onClick={() => shift(-1)}>上月</button>
          <h2 className="font-semibold">{y} 年 {m + 1} 月</h2>
          <button className="border rounded-lg px-3 py-2 text-sm" onClick={() => shift(1)}>下月</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">{['一', '二', '三', '四', '五', '六', '日'].map((w) => <div key={w}>{w}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => d ? (
            <button key={d} onClick={() => setSelected(d)} aria-label={`${d} ${hasMark(d) ? '有安排' : ''}`} className={`aspect-square rounded-xl text-sm flex flex-col items-center justify-center min-h-10 ${selected === d ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {Number(d.slice(-2))}{hasMark(d) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />}
            </button>
          ) : <div key={`e${i}`} />)}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">{selected} 当天</h2>
        <p className="text-sm text-slate-500">学习记录：{daySessions.length} 条，共 {daySessions.reduce((a, s) => a + s.minutes, 0)} 分钟</p>
        <ul className="text-sm mt-1 space-y-1">{daySessions.map((s) => <li key={s.id}>• {s.title}（{s.minutes} 分钟）</li>)}</ul>
        <p className="text-sm text-slate-500 mt-2">任务：{dayTasks.filter((t) => t.done).length}/{dayTasks.length} 已完成</p>
        <ul className="text-sm mt-1 space-y-1">{dayTasks.map((t) => <li key={t.id}>• {t.title}（{t.done ? '已完成' : '未完成'}）</li>)}</ul>
        <p className="text-sm text-slate-500 mt-2">到期复习：{dayDue.length} 道</p>
        <ul className="text-sm mt-1 space-y-1">{dayDue.map((mm) => <li key={mm.id}>• {mm.title}（{mm.subject_name}）</li>)}</ul>
        {daySessions.length + dayTasks.length + dayDue.length === 0 && <p className="text-sm text-slate-500 mt-2">这一天还没有安排。</p>}
      </Card>
      <p className="text-xs text-slate-500">注：日历本身不伪造打卡数据；只有你记了学习记录、生成了任务或题目到了复习日期，才会出现标记。</p>
    </div>
  )
}
