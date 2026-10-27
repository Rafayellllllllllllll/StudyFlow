import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { REVIEW_EXPLAIN, reviewBucket } from '../lib/review'
import { fmtDate } from '../lib/types'

const ORDER = ['连续答错', '已到期', '未复习', '未到期', '已掌握'] as const

export default function ReviewPlan() {
  const { mistakes, reviewMistake } = useStore()
  const live = mistakes.filter((m) => !m.deleted_at)
  const groups = ORDER.map((b) => ({ bucket: b, items: live.filter((m) => reviewBucket(m) === b) }))
  return (
    <div className="space-y-3">
      <PageTitle title="复习计划" sub="按状态分组：连续答错最优先，其次是已到期和从未复习的题目。" />
      <Card><p className="text-sm leading-relaxed">{REVIEW_EXPLAIN}</p></Card>
      {live.length === 0 ? <Empty title="还没有可复习的错题" hint="先新增错题，复习计划会自动生成。" action={<Btn to="/mistakes/new">新增错题</Btn>} /> : groups.map(({ bucket, items }) => (
        <Card key={bucket}>
          <h2 className="font-semibold mb-2">{bucket}（{items.length}）</h2>
          {items.length === 0 ? <p className="text-sm text-slate-500">这一组目前没有题目。</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.slice(0, 20).map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0"><Link to={`/mistakes/${m.id}`} className="text-sm font-medium truncate block">{m.title}</Link><p className="text-xs text-slate-500">{m.subject_name} · 下次 {fmtDate(m.next_review_at)} · {m.mastery}</p></div>
                  <button onClick={() => reviewMistake(m.id, true)} className="shrink-0 text-xs bg-emerald-600 text-white rounded-lg px-2 py-1.5 min-h-9">答对</button>
                  <button onClick={() => reviewMistake(m.id, false)} className="shrink-0 text-xs bg-red-600 text-white rounded-lg px-2 py-1.5 min-h-9">答错</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}
