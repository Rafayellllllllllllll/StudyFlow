import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { subjectStats } from '../lib/filters'
import { todayStr } from '../lib/types'

type Period = 'day' | 'week' | 'month'
function rangeFor(p: Period): [string, string] {
  const now = new Date()
  const from = new Date(now)
  if (p === 'day') from.setDate(now.getDate() - 1)
  if (p === 'week') from.setDate(now.getDate() - 7)
  if (p === 'month') from.setMonth(now.getMonth() - 1)
  return [from.toISOString().slice(0, 10), todayStr(now)]
}

export default function SubjectStats() {
  const { mistakes, subjects } = useStore()
  const [period, setPeriod] = useState<Period>('week')
  const [from, to] = rangeFor(period)
  const names = useMemo(() => subjects.map((s) => s.name), [subjects])
  // 只显示已有学科：用户只加数学就只显示数学，后加学科再动态出现
  const rows = useMemo(() => subjectStats(mistakes, names, from, to), [mistakes, names, from, to])
  const max = Math.max(1, ...rows.map((r) => r.total))
  const total = rows.reduce((a, r) => a + r.total, 0)

  return (
    <div className="space-y-3">
      <PageTitle title="学科统计" sub={`统计区间：${from} 至 ${to}（按创建时间）。图表只用你的真实数据，没有示例数据。`} />
      <div className="flex gap-2" role="group" aria-label="统计区间">
        {([['day', '日'], ['week', '周'], ['month', '月']] as [Period, string][]).map(([p, label]) => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 rounded-xl py-2.5 text-sm min-h-11 ${period === p ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border'}`}>{label}</button>
        ))}
      </div>
      {rows.length === 0 || total === 0 ? (
        <Empty title="还没有可统计的学科" hint="先新增一道错题并填写学科（例如只加数学，统计就只显示数学），这里会自动出现。" action={<Btn to="/mistakes/new">新增错题</Btn>} />
      ) : (
        <Card>
          <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
            <div><p className="font-bold text-lg">{total}</p><p className="text-xs text-slate-500">总数</p></div>
            <div><p className="font-bold text-lg">{rows.reduce((a, r) => a + r.unreviewed, 0)}</p><p className="text-xs text-slate-500">未复习</p></div>
            <div><p className="font-bold text-lg">{rows.reduce((a, r) => a + r.mastered, 0)}</p><p className="text-xs text-slate-500">已掌握</p></div>
            <div><p className="font-bold text-lg">{rows.reduce((a, r) => a + r.recent, 0)}</p><p className="text-xs text-slate-500">近7天新增</p></div>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.name}>
                <Link to={`/mistakes?subject=${encodeURIComponent(r.name)}`} className="block min-w-0">
                  <div className="flex flex-wrap justify-between text-sm gap-2"><span className="font-medium truncate">{r.name}</span><span className="shrink-0 text-slate-500">{r.total} 道 · 未复习 {r.unreviewed} · 已掌握 {r.mastered} · 近新增 {r.recent} · 到期 {r.due}</span></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden" role="img" aria-label={`${r.name}共 ${r.total} 道错题`}>
                    <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${Math.round((r.total / max) * 100)}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">点任意学科可进入该学科的错题列表。条形长度按学科间总数横向对比。</p>
        </Card>
      )}
    </div>
  )
}
