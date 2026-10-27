import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { fmtDate, todayStr } from '../lib/types'
import { reviewBucket } from '../lib/review'

export default function Dashboard() {
  const { mistakes, subjects, sessions, reviewMistake } = useStore()
  const live = mistakes.filter((m) => !m.deleted_at)
  const today = todayStr()
  const due = live.filter((m) => reviewBucket(m) === '已到期' || reviewBucket(m) === '未复习' || reviewBucket(m) === '连续答错')
  const todayMinutes = sessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0)
  const recent = live.filter((m) => { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(m.created_at) >= d }).length

  const stats = [
    { label: '错题总数', value: live.length },
    { label: '未复习', value: live.filter((m) => !m.last_reviewed_at).length },
    { label: '已掌握', value: live.filter((m) => m.mastery === '已掌握').length },
    { label: '今日到期/待复习', value: due.length },
    { label: '近 7 天新增', value: recent },
    { label: '今日学习分钟', value: todayMinutes },
  ]

  return (
    <div className="space-y-3">
      <PageTitle title="学习仪表盘" sub="今天该复习什么、先看这里；数据全部来自你自己的记录，不是示例数据。" />
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <Card key={s.label} className="p-3 text-center"><p className="text-xl font-bold leading-tight">{s.value}</p><p className="text-xs text-slate-500 mt-1">{s.label}</p></Card>
        ))}
      </div>
      {live.length === 0 ? (
        <Empty title="还没有任何错题" hint="先新增第一道错题，仪表盘、统计和复习计划才会出现真实数据。" action={<Btn to="/mistakes/new">新增第一道错题</Btn>} />
      ) : (
        <>
          <Card>
            <h2 className="font-semibold mb-2">待复习（按到期优先）</h2>
            {due.length === 0 ? <p className="text-sm text-slate-500">今天没有到期题目，继续保持。</p> : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {due.slice(0, 5).map((m) => (
                  <li key={m.id} className="py-2 flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0"><Link to={`/mistakes/${m.id}`} className="font-medium text-sm truncate block">{m.title}</Link><p className="text-xs text-slate-500">{m.subject_name} · {reviewBucket(m)} · 下次 {fmtDate(m.next_review_at)}</p></div>
                    <button onClick={() => reviewMistake(m.id, true)} className="shrink-0 text-xs bg-emerald-600 text-white rounded-lg px-2 py-1.5 min-h-9">答对</button>
                    <button onClick={() => reviewMistake(m.id, false)} className="shrink-0 text-xs bg-red-600 text-white rounded-lg px-2 py-1.5 min-h-9">答错</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2"><Btn to="/review" variant="ghost">查看全部复习计划</Btn></div>
          </Card>
          <Card>
            <h2 className="font-semibold mb-2">你的学科</h2>
            {subjects.length === 0 ? <p className="text-sm text-slate-500">还没有学科，新增错题时输入学科名即可自动创建。</p> : (
              <div className="flex flex-wrap gap-2">{subjects.map((s) => <Link key={s.id} to={`/mistakes?subject=${encodeURIComponent(s.name)}`} className="text-sm bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5">{s.name}（{live.filter((m) => m.subject_name === s.name).length}）</Link>)}</div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
