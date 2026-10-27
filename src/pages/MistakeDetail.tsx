import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { fmtDate } from '../lib/types'
import { REVIEW_EXPLAIN, reviewBucket } from '../lib/review'
import { MistakeForm } from '../components/MistakeForm'

export default function MistakeDetail() {
  const { id } = useParams()
  const { mistakes, updateMistake, softDelete, restore, hardDelete, reviewMistake, setToast } = useStore()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const m = mistakes.find((x) => x.id === id)
  if (!m) return <Empty title="找不到这道题" hint="它可能已被彻底删除，或链接不对。" action={<Btn to="/mistakes">回错题列表</Btn>} />

  return (
    <div className="space-y-3">
      <PageTitle title={m.title} sub={`${m.subject_name} · ${m.type} · ${m.difficulty} · ${m.mastery}${m.deleted_at ? ' · 已删除（回收站）' : ''}`} />
      {editing ? (
        <Card><MistakeForm initial={m} onSaved={() => setEditing(false)} /><button className="w-full text-sm underline mt-2" onClick={() => setEditing(false)}>取消编辑</button></Card>
      ) : (
        <>
          <Card>
            <h2 className="font-semibold text-sm mb-1">题目</h2><p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
            {m.image_url && <img src={m.image_url} alt="题目图片" className="mt-2 max-h-64 rounded-xl border" />}
            <h2 className="font-semibold text-sm mt-4 mb-1">答案</h2><p className="text-sm whitespace-pre-wrap break-words">{m.answer}</p>
            <h2 className="font-semibold text-sm mt-4 mb-1">解析</h2><p className="text-sm whitespace-pre-wrap break-words">{m.analysis || '未填'}</p>
            <p className="text-sm mt-3 text-slate-500">知识点：{m.knowledge_points.join('、') || '未填'} · 收藏：{m.favorite ? '是' : '否'} · 连续答错：{m.consecutive_wrong} 次</p>
            <p className="text-sm text-slate-500">创建：{fmtDate(m.created_at)} · 最近复习：{fmtDate(m.last_reviewed_at)} · 下次复习：{fmtDate(m.next_review_at)} · 状态：{reviewBucket(m)}</p>
            {m.note && <><h2 className="font-semibold text-sm mt-4 mb-1">备注</h2><p className="text-sm whitespace-pre-wrap break-words">{m.note}</p></>}
          </Card>
          <Card>
            <h2 className="font-semibold mb-2">复习</h2>
            <p className="text-xs text-slate-500 mb-2">{REVIEW_EXPLAIN}</p>
            <div className="flex flex-wrap gap-2">
              <button className="bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm min-h-11" onClick={() => reviewMistake(m.id, true)}>这次答对了</button>
              <button className="bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm min-h-11" onClick={() => reviewMistake(m.id, false)}>这次答错了</button>
              <button className="border rounded-xl px-4 py-2.5 text-sm min-h-11" onClick={() => { updateMistake(m.id, { favorite: !m.favorite }); setToast(m.favorite ? '已取消收藏' : '已收藏') }}>{m.favorite ? '取消收藏' : '收藏'}</button>
            </div>
            <div className="flex gap-2 mt-3">
              <input aria-label="手动改下次复习日期" type="date" className="flex-1 rounded-xl border px-3 py-2.5 dark:bg-slate-900 dark:border-slate-700" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              <button className="border rounded-xl px-3 py-2.5 text-sm" onClick={() => { if (!manualDate) { setToast('请先选一个日期'); return } updateMistake(m.id, { next_review_at: new Date(manualDate).toISOString() }); setToast(`下次复习已手动改为 ${manualDate}`) }}>手动改日期</button>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={() => setEditing(true)}>编辑</Btn>
            {m.deleted_at ? (
              <><Btn variant="ghost" onClick={() => { restore(m.id); setToast('已恢复') }}>恢复</Btn>
              <Btn variant="danger" onClick={() => { if (window.confirm('彻底删除后无法恢复，确认吗？')) { hardDelete(m.id); setToast('已彻底删除'); nav('/mistakes') } }}>彻底删除</Btn></>
            ) : (
              <Btn variant="danger" onClick={() => { if (window.confirm('确认删除这道题吗？删除后可在错题列表的回收站里恢复。')) { softDelete(m.id); setToast('已移到回收站'); nav('/mistakes') } }}>删除</Btn>
            )}
            <Link to="/mistakes" className="text-sm underline self-center">回列表</Link>
          </div>
        </>
      )}
    </div>
  )
}
