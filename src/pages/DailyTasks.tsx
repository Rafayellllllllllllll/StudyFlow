import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { todayStr } from '../lib/types'

export default function DailyTasks() {
  const { tasks, toggleTask, generateDailyTasks, setToast } = useStore()
  const today = todayStr()
  const list = tasks.filter((t) => t.date === today)
  const done = list.filter((t) => t.done).length
  return (
    <div className="space-y-3">
      <PageTitle title="每日任务" sub={`今天 ${today} · 已完成 ${done}/${list.length}`} />
      <Card>
        <p className="text-sm text-slate-500 mb-3">点“生成今日任务”会把到期和从未复习的错题变成任务，已生成的不会重复生成。</p>
        <Btn onClick={() => { generateDailyTasks() }}>生成今日任务</Btn>
      </Card>
      {list.length === 0 ? <Empty title="今天还没有任务" hint="点上方生成今日任务，或先新增错题。" action={<Btn to="/mistakes/new">新增错题</Btn>} /> : (
        <ul className="space-y-2">{list.map((t) => (
          <li key={t.id}><Card className="flex items-center gap-2">
            <input aria-label={t.title} type="checkbox" checked={t.done} onChange={() => { toggleTask(t.id); setToast(t.done ? '已取消完成' : '任务已完成') }} />
            <span className={`flex-1 text-sm ${t.done ? 'line-through text-slate-400' : ''}`}>{t.title}</span>
            {t.mistake_id && <Link to={`/mistakes/${t.mistake_id}`} className="text-xs underline shrink-0">去复习</Link>}
          </Card></li>
        ))}</ul>
      )}
      {tasks.filter((t) => t.date !== today).length > 0 && (
        <Card><h2 className="font-semibold text-sm mb-2">往日任务</h2><ul className="space-y-1 text-sm">{tasks.filter((t) => t.date !== today).slice(0, 20).map((t) => <li key={t.id} className="flex justify-between gap-2"><span className="truncate">{t.title}</span><span className="shrink-0 text-slate-500">{t.date} · {t.done ? '已完成' : '未完成'}</span></li>)}</ul></Card>
      )}
    </div>
  )
}
