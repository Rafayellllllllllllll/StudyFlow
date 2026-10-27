import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'

export default function KnowledgeStats() {
  const { mistakes } = useStore()
  const live = mistakes.filter((m) => !m.deleted_at)
  const map = new Map<string, { total: number; mastered: number; unreviewed: number }>()
  for (const m of live) for (const k of m.knowledge_points) {
    const cur = map.get(k) ?? { total: 0, mastered: 0, unreviewed: 0 }
    cur.total++; if (m.mastery === '已掌握') cur.mastered++; if (!m.last_reviewed_at) cur.unreviewed++
    map.set(k, cur)
  }
  const rows = [...map.entries()].sort((a, b) => b[1].total - a[1].total)
  const max = Math.max(1, ...rows.map(([, v]) => v.total))
  return (
    <div className="space-y-3">
      <PageTitle title="知识点统计" sub="按错题里填写的知识点自动汇总；没填知识点的错题不计入这里。" />
      {rows.length === 0 ? <Empty title="还没有知识点数据" hint="新增错题时在“知识点”一栏用逗号分隔填写，统计会自动出现。" action={<Btn to="/mistakes/new">新增错题</Btn>} /> : (
        <Card><ul className="space-y-3">
          {rows.map(([name, v]) => (
            <li key={name}>
              <Link to={`/mistakes?knowledge=${encodeURIComponent(name)}`} className="block">
                <div className="flex flex-wrap justify-between text-sm gap-2"><span className="font-medium truncate">{name}</span><span className="shrink-0 text-slate-500">{v.total} 道 · 已掌握 {v.mastered} · 未复习 {v.unreviewed}</span></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${Math.round((v.total / max) * 100)}%` }} /></div>
              </Link>
            </li>
          ))}
        </ul><p className="text-xs text-slate-500 mt-3">点知识点可进入含该知识点的错题列表（列表页会自动带上该知识点筛选）。</p></Card>
      )}
    </div>
  )
}
