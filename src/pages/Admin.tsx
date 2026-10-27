import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, PageTitle } from '../components/ui'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Admin() {
  const { mode, mistakes, subjects, sessions, tasks, reviews, lastError, user } = useStore()
  const [check, setCheck] = useState('')
  const [checking, setChecking] = useState(false)
  let lsSize = 0
  try { lsSize = new Blob([localStorage.getItem('studyflow-demo-v1') || '']).size } catch { lsSize = 0 }

  async function runCheck() {
    setChecking(true); setCheck('')
    try {
      if (!isSupabaseConfigured || !supabase) { setCheck('未配置 Supabase：请在 .env 里填 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY（不要填 service_role），并跑 supabase/migrations 里的 SQL。当前为演示模式，诊断只能检查本机数据。'); return }
      const { error, count } = await supabase.from('mistakes').select('id', { count: 'exact', head: true })
      if (error) throw new Error(error.message)
      setCheck(`Supabase 连接正常：mistakes 表可访问，当前计数查询返回 ${count ?? '未知'}（RLS 下只应看到本人数据；若表未建，请先跑 migration）。`)
    } catch (e) { setCheck(`连接检查失败：${e instanceof Error ? e.message : '未知错误'}。请先确认已跑 migration、RLS 策略已建、且 anon 密钥正确。`) }
    finally { setChecking(false) }
  }

  return (
    <div className="space-y-3">
      <PageTitle title="管理与诊断" sub="这里只显示状态和计数，不显示任何密钥值。" />
      <Card>
        <ul className="text-sm space-y-1">
          <li>运行模式：{mode === 'demo' ? '演示模式（未连接 Supabase，数据只在本机浏览器）' : 'Supabase 模式'}</li>
          <li>Supabase 环境变量：{isSupabaseConfigured ? '已配置 URL 与 anon 密钥（值不显示）' : '未配置'}</li>
          <li>登录账号：{user?.email ?? '未登录'}</li>
          <li>错题：{mistakes.filter((m) => !m.deleted_at).length} 道在用，{mistakes.filter((m) => m.deleted_at).length} 道在回收站</li>
          <li>学科：{subjects.length} 个 · 知识点记录：{mistakes.flatMap((m) => m.knowledge_points).length} 条</li>
          <li>复习记录：{reviews.length} 条 · 学习记录：{sessions.length} 条 · 任务：{tasks.length} 条</li>
          <li>本机数据大小：约 {lsSize} 字节（localStorage）</li>
          <li>最近错误：{lastError ?? '无'}</li>
        </ul>
        <button className="mt-3 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-3 text-sm min-h-12" disabled={checking} onClick={() => void runCheck()}>{checking ? '检查中…' : '检查 Supabase 连接 / 表访问'}</button>
        {check && <p role="status" className="text-sm mt-2 leading-relaxed">{check}</p>}
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">部署前检查清单（阶段 G 待用户操作）</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside text-slate-600 dark:text-slate-300">
          <li>用户给出 StudyFlow 的新 GitHub 仓库名，并把该仓库加进 Muse 的 GitHub App 可访问范围。</li>
          <li>用户新建 StudyFlow 专用的 Supabase 项目（不复用错题本的 cuotiben）。</li>
          <li>用户通过安全表单提供该项目的地址与 anon 密钥（不发 service_role、不在聊天里发密钥）。</li>
          <li>在 Supabase SQL 编辑器里依次跑 supabase/migrations/ 下的 SQL，确认 RLS 已启用。</li>
          <li>配置环境变量后重新构建并验证登录、新增、复习、导入导出。</li>
        </ol>
        <p className="text-sm text-slate-500 mt-2">当前状态：以上步骤均未完成，因此本应用尚未推送、尚未部署；上面列出的不是已完成项。</p>
      </Card>
    </div>
  )
}
