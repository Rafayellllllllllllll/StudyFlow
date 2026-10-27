import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStore } from '../lib/store'
import { Card, PageTitle } from '../components/ui'
import { sessionSchema } from '../lib/validate'
import { todayStr } from '../lib/types'

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 min-h-11'

export default function Sessions() {
  const { sessions, addSession, setToast } = useStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(sessionSchema), defaultValues: { date: todayStr(), minutes: 30, title: '' } })
  const total = sessions.reduce((a, s) => a + s.minutes, 0)
  return (
    <div className="space-y-3">
      <PageTitle title="学习记录" sub={`累计 ${sessions.length} 条 · ${total} 分钟（只统计你自己记的记录）`} />
      <Card>
        <form onSubmit={handleSubmit((d) => { addSession(d); setToast('学习记录已保存'); reset({ date: todayStr(), minutes: 30, title: '' }) })} className="space-y-2">
          <div><label className="text-sm font-medium" htmlFor="stitle">学习内容</label><input id="stitle" className={inputCls} placeholder="例如：数学错题复习" {...register('title')} />{errors.title && <p role="alert" className="text-xs text-red-600">{errors.title.message}</p>}</div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-sm font-medium" htmlFor="smin">分钟</label><input id="smin" type="number" className={inputCls} {...register('minutes')} />{errors.minutes && <p role="alert" className="text-xs text-red-600">{errors.minutes.message}</p>}</div>
            <div><label className="text-sm font-medium" htmlFor="sdate">日期</label><input id="sdate" type="date" className={inputCls} {...register('date')} /></div>
          </div>
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-3 min-h-12 text-sm font-medium">保存学习记录</button>
        </form>
      </Card>
      <ul className="space-y-2">{sessions.map((s) => <li key={s.id}><Card className="flex justify-between gap-2"><span className="text-sm truncate">{s.title}</span><span className="text-sm text-slate-500 shrink-0">{s.date} · {s.minutes} 分钟</span></Card></li>)}</ul>
      {sessions.length === 0 && <p className="text-sm text-slate-500 text-center py-6">还没有学习记录，上面记一条试试。</p>}
    </div>
  )
}
