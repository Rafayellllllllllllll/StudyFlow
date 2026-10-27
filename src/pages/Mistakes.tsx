import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { EMPTY_FILTER, filterMistakes, sortMistakes, type SortKey } from '../lib/filters'
import { DIFFICULTIES, MASTERIES, fmtDate } from '../lib/types'

const PAGE_SIZE = 10

export default function Mistakes() {
  const { mistakes, subjects, bulk, setToast } = useStore()
  const [params] = useSearchParams()
  const [f, setF] = useState({ ...EMPTY_FILTER, subject: params.get('subject') ?? '', knowledge: params.get('knowledge') ?? '' })
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [showDeleted, setShowDeleted] = useState(false)

  const types = useMemo(() => [...new Set(mistakes.filter((m) => !m.deleted_at).map((m) => m.type))], [mistakes])
  const knowledges = useMemo(() => [...new Set(mistakes.flatMap((m) => m.knowledge_points))], [mistakes])
  const filtered = useMemo(() => sortMistakes(filterMistakes(mistakes, { ...f, includeDeleted: showDeleted }), sort), [mistakes, f, sort, showDeleted])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm min-h-10'

  function runBulk(action: 'delete' | 'favorite' | 'mastered' | 'restore') {
    if (!selected.length) { setToast('请先勾选错题'); return }
    if (action === 'delete' && !window.confirm(`确认删除选中的 ${selected.length} 道错题吗？删除后可在“回收站”里恢复。`)) return
    bulk(selected, action); setSelected([]); setToast('批量操作已完成')
  }

  return (
    <div className="space-y-3">
      <PageTitle title="错题列表" sub="搜索、筛选、排序、批量操作都在这里；学科和类型都来自你的实际数据。" />
      <div className="flex gap-2">
        <input aria-label="搜索错题" placeholder="搜索标题、题目、答案、知识点…" className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 dark:bg-slate-900 dark:border-slate-700" value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1) }} />
        <Btn to="/mistakes/new">新增</Btn>
      </div>
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select aria-label="筛选学科" className={selCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}><option value="">全部学科</option>{subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
          <select aria-label="筛选类型" className={selCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="">全部类型</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
          <select aria-label="筛选难度" className={selCls} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="">全部难度</option>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select>
          <select aria-label="筛选掌握程度" className={selCls} value={f.mastery} onChange={(e) => setF({ ...f, mastery: e.target.value })}><option value="">全部掌握程度</option>{MASTERIES.map((d) => <option key={d}>{d}</option>)}</select>
          <select aria-label="筛选知识点" className={selCls} value={f.knowledge} onChange={(e) => setF({ ...f, knowledge: e.target.value })}><option value="">全部知识点</option>{knowledges.map((k) => <option key={k}>{k}</option>)}</select>
          <select aria-label="排序" className={selCls} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="newest">最新在前</option><option value="oldest">最早在前</option><option value="dueFirst">到期在前</option><option value="masteryAsc">未掌握在前</option></select>
          <input aria-label="开始日期" type="date" className={selCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <input aria-label="结束日期" type="date" className={selCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={f.onlyFavorite} onChange={(e) => setF({ ...f, onlyFavorite: e.target.checked })} /> 只看收藏</label>
          <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} /> 回收站（已删除）</label>
          <button className="text-sm underline" onClick={() => setF(EMPTY_FILTER)}>清空筛选</button>
        </div>
      </Card>

      {selected.length > 0 && (
        <Card><p className="text-sm mb-2">已选 {selected.length} 道</p><div className="flex flex-wrap gap-2">
          <button className="text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-3 py-2" onClick={() => runBulk('favorite')}>批量收藏</button>
          <button className="text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-3 py-2" onClick={() => runBulk('mastered')}>批量标已掌握</button>
          {showDeleted ? <button className="text-sm bg-emerald-600 text-white rounded-lg px-3 py-2" onClick={() => runBulk('restore')}>批量恢复</button> : <button className="text-sm bg-red-600 text-white rounded-lg px-3 py-2" onClick={() => runBulk('delete')}>批量删除</button>}
        </div></Card>
      )}

      {pageItems.length === 0 ? <Empty title={showDeleted ? '回收站是空的' : '没有符合条件的错题'} hint="换个筛选条件，或者新增一道错题。" action={<Btn to="/mistakes/new">新增错题</Btn>} /> : (
        <ul className="space-y-2">
          {pageItems.map((m) => (
            <li key={m.id}>
              <Card className="flex gap-2">
                <input aria-label={`选择 ${m.title}`} type="checkbox" checked={selected.includes(m.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, m.id] : selected.filter((id) => id !== m.id))} className="mt-1 shrink-0" />
                <Link to={`/mistakes/${m.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.favorite ? '⭐ ' : ''}{m.title}</p>
                  <p className="text-xs text-slate-500 truncate">{m.subject_name} · {m.type} · {m.difficulty} · {m.mastery} · {fmtDate(m.created_at)}</p>
                  <p className="text-xs text-slate-500 truncate">知识点：{m.knowledge_points.join('、') || '未填'}</p>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between text-sm">
        <span>共 {filtered.length} 道 · 第 {page}/{pages} 页</span>
        <span className="flex gap-2">
          <button disabled={page <= 1} className="border rounded-lg px-3 py-2 disabled:opacity-40" onClick={() => setPage(page - 1)}>上一页</button>
          <button disabled={page >= pages} className="border rounded-lg px-3 py-2 disabled:opacity-40" onClick={() => setPage(page + 1)}>下一页</button>
        </span>
      </div>
    </div>
  )
}
