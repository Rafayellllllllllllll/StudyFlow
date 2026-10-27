import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { mistakeSchema, type MistakeForm as FormData } from '../lib/validate'
import { DIFFICULTIES, type Mistake } from '../lib/types'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { safeImageName, validateImageFile } from '../lib/importExport'

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 min-h-11'

export function MistakeForm({ initial, onSaved }: { initial?: Mistake; onSaved: (id: string) => void }) {
  const { subjects, addMistake, updateMistake, setToast, mode, user } = useStore()
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null)
  const [imageName, setImageName] = useState<string | null>(initial?.image_name ?? null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadMsg, setUploadMsg] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(mistakeSchema),
    defaultValues: initial ? {
      subject_name: initial.subject_name, title: initial.title, content: initial.content,
      answer: initial.answer, analysis: initial.analysis, knowledge_points: initial.knowledge_points.join('，'),
      type: initial.type, difficulty: initial.difficulty, note: initial.note,
    } : { difficulty: '中等', type: '选择题', knowledge_points: '', analysis: '', note: '' },
  })

  async function doUpload(file: File) {
    const err = validateImageFile(file)
    if (err) { setUploadState('error'); setUploadMsg(err); setPendingFile(file); return }
    setUploadState('uploading'); setUploadMsg('正在上传…')
    try {
      if (mode === 'supabase' && supabase) {
        // 私有 bucket：路径第一段必须是本人 user_id，RLS/Storage 策略据此隔离（见 migration）
        const path = `${user?.id ?? 'unknown'}/${safeImageName(file.name)}`
        const { error } = await supabase.storage.from('mistake-images').upload(path, file)
        if (error) throw new Error(error.message)
        const { data, error: urlErr } = await supabase.storage.from('mistake-images').createSignedUrl(path, 60 * 60 * 24 * 7)
        if (urlErr) throw new Error(urlErr.message)
        setImageUrl(data.signedUrl); setImageName(path)
      } else {
        // 演示模式：只存本机浏览器，不上传任何服务器，并明确标注
        const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('读取图片失败')); r.readAsDataURL(file) })
        setImageUrl(url); setImageName(file.name)
      }
      setUploadState('done'); setUploadMsg(mode === 'supabase' ? '上传成功' : '演示模式：图片只存在本机浏览器，未上传服务器')
    } catch (e) {
      setUploadState('error'); setUploadMsg(e instanceof Error ? `上传失败：${e.message}，可点重试` : '上传失败，可点重试'); setPendingFile(file)
    }
  }

  const onSubmit = (data: FormData) => {
    const base = {
      subject_name: data.subject_name, title: data.title, content: data.content,
      answer: data.answer, analysis: data.analysis, knowledge_points: data.knowledge_points.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      type: data.type, difficulty: data.difficulty, note: data.note,
      image_url: imageUrl, image_name: imageName,
    }
    if (initial) { updateMistake(initial.id, { ...base, mastery: initial.mastery, favorite: initial.favorite }); setToast('已保存修改'); onSaved(initial.id) }
    else { const created = addMistake({ ...base, mastery: '未掌握', favorite: false }); setToast('已新增错题'); onSaved(created.id) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div>
        <label className="text-sm font-medium" htmlFor="subject_name">学科（可自定义，不写死）</label>
        <input id="subject_name" list="subject-list" className={inputCls} placeholder="例如：数学" {...register('subject_name')} />
        <datalist id="subject-list">{subjects.map((s) => <option key={s.id} value={s.name} />)}</datalist>
        {errors.subject_name && <p role="alert" className="text-xs text-red-600 mt-1">{errors.subject_name.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="title">题目标题</label>
        <input id="title" className={inputCls} {...register('title')} />
        {errors.title && <p role="alert" className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="content">题目内容</label>
        <textarea id="content" rows={4} className={inputCls} {...register('content')} />
        {errors.content && <p role="alert" className="text-xs text-red-600 mt-1">{errors.content.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="image">题目图片（PNG/JPG/WEBP/GIF，≤5MB）</label>
        <input id="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className={inputCls} onChange={(e) => { const f = e.target.files?.[0]; if (f) void doUpload(f) }} />
        {uploadState === 'uploading' && <p className="text-xs text-slate-500 mt-1">上传中…</p>}
        {uploadMsg && <p className={`text-xs mt-1 ${uploadState === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{uploadMsg}</p>}
        {uploadState === 'error' && pendingFile && <button type="button" className="text-sm underline mt-1" onClick={() => void doUpload(pendingFile)}>重试上传</button>}
        {imageUrl && <img src={imageUrl} alt="题目图片预览" className="mt-2 max-h-48 rounded-xl border" />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="type">错题类型（可自定义）</label>
          <input id="type" list="type-list" className={inputCls} placeholder="例如：选择题" {...register('type')} />
          <datalist id="type-list"><option value="选择题" /><option value="判断题" /><option value="主观题" /><option value="计算题" /></datalist>
          {errors.type && <p role="alert" className="text-xs text-red-600 mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="difficulty">难度</label>
          <select id="difficulty" className={inputCls} {...register('difficulty')}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="answer">答案</label>
        <textarea id="answer" rows={3} className={inputCls} {...register('answer')} />
        {errors.answer && <p role="alert" className="text-xs text-red-600 mt-1">{errors.answer.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="analysis">解析</label>
        <textarea id="analysis" rows={3} className={inputCls} {...register('analysis')} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="knowledge_points">知识点（逗号分隔）</label>
        <input id="knowledge_points" className={inputCls} placeholder="例如：二次函数，顶点式" {...register('knowledge_points')} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="note">备注</label>
        <textarea id="note" rows={2} className={inputCls} {...register('note')} />
      </div>
      <button disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-3 font-medium min-h-12 disabled:opacity-50">{initial ? '保存修改' : '新增错题'}</button>
    </form>
  )
}
