import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Empty, PageTitle } from '../components/ui'
import { downloadText, mistakesToCsv, mistakesToJson, validateImportJson, type ImportResult } from '../lib/importExport'

export default function ImportExport() {
  const { mistakes, importMistakes, setToast } = useStore()
  const live = mistakes.filter((m) => !m.deleted_at)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [fileText, setFileText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setFileText(text)
    // 只预览和校验，不写库：错误数据不会部分破坏已有记录
    setPreview(validateImportJson(text, live.map((m) => m.title)))
  }
  function confirmImport() {
    if (!preview?.ok) return
    const n = importMistakes(preview.items)
    setToast(`已导入 ${n} 道错题${preview.conflicts.length ? `（其中 ${preview.conflicts.length} 道标题与已有记录重复，已另存为新记录）` : ''}`)
    setPreview(null); setFileText(''); if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <PageTitle title="数据导入导出" sub="导出只含未删除的错题；导入先预览、校验、提示冲突，确认后才写入，取消则什么都不改。" />
      <Card>
        <h2 className="font-semibold mb-2">导出（共 {live.length} 道）</h2>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => { downloadText('studyflow-mistakes.json', mistakesToJson(live)); setToast('JSON 已导出') }}>导出 JSON</Btn>
          <Btn variant="ghost" onClick={() => { downloadText('studyflow-mistakes.csv', mistakesToCsv(live), 'text/csv'); setToast('CSV 已导出') }}>导出 CSV</Btn>
        </div>
        {live.length === 0 && <p className="text-sm text-slate-500 mt-2">还没有可导出的错题。</p>}
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">导入 JSON</h2>
        <p className="text-sm text-slate-500 mb-2">格式示例：{"{ mistakes: [{ subject_name, title, content, answer, type, difficulty }] }"}，或直接是一个数组。学科不存在时会自动创建。</p>
        <input ref={inputRef} type="file" accept=".json,application/json" className="w-full rounded-xl border px-3 py-2.5 dark:border-slate-700" onChange={onFile} />
        {preview && !preview.ok && <div role="alert" className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl p-3">{preview.errors.map((e) => <p key={e}>{e}</p>)}<p className="mt-1 text-slate-500">未写入任何数据，请修好文件再重新选择。</p></div>}
        {preview?.ok && (
          <div className="mt-2">
            <p className="text-sm">预览：{preview.items.length} 道可导入</p>
            {preview.conflicts.length > 0 && <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">冲突提示：以下标题已存在，导入后会另存为新记录，不会覆盖原记录：{preview.conflicts.join('、')}</p>}
            <ul className="text-sm mt-2 space-y-1 max-h-48 overflow-auto">{preview.items.slice(0, 20).map((it, i) => <li key={i}>• {it.subject_name} · {it.title}</li>)}</ul>
            <div className="flex gap-2 mt-3">
              <Btn onClick={confirmImport}>确认导入</Btn>
              <Btn variant="ghost" onClick={() => { setPreview(null); setFileText(''); if (inputRef.current) inputRef.current.value = '' }}>取消</Btn>
            </div>
            <p className="text-xs text-slate-500 mt-1">已选文件大小约 {fileText.length} 字符，仅在本地校验，不上传服务器（演示模式）。</p>
          </div>
        )}
      </Card>
      <Card><h2 className="font-semibold mb-2">备份说明</h2><p className="text-sm text-slate-500 leading-relaxed">演示模式下数据只在浏览器本地存储，换设备或清浏览器数据会丢失，请定期用上方导出做备份。连接 Supabase 后，数据在数据库里，导出仍可作为额外备份。</p></Card>
      {live.length === 0 && <Empty title="还没有数据" hint="导出需要先有错题，导入可以直接选一个 StudyFlow 导出的 JSON 文件。" action={<Btn to="/mistakes/new">新增错题</Btn>} />}
    </div>
  )
}
