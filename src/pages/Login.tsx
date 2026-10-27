import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { Btn, Card, PageTitle } from '../components/ui'

export default function Login() {
  const { login, mode, setToast } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(isRegister: boolean) {
    setError('')
    if (!email.includes('@')) { setError('请填写正确的邮箱'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }
    setLoading(true)
    try {
      if (mode === 'supabase' && supabase) {
        const r = isRegister ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
        if (r.error) throw new Error(r.error.message)
        login(email)
        setToast(isRegister ? '注册请求已提交，请按邮箱提示完成确认' : '登录成功')
      } else {
        // 演示模式：不做真实鉴权，仅本机记住邮箱，绝不冒充 Supabase Auth
        login(email)
        setToast('演示模式登录成功：仅本机使用，未连接 Supabase Auth')
      }
      nav('/')
    } catch (e) { setError(e instanceof Error ? e.message : '登录失败，请重试') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto">
      <PageTitle title="登录 / 注册" sub={mode === 'demo' ? '演示模式：未连接 Supabase，账号只存在本机浏览器，不会同步到服务器。' : '已连接 Supabase Auth，请用真实账号登录。'} />
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); void submit(false) }} className="space-y-3">
          <div><label className="text-sm font-medium" htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="email" className="w-full rounded-xl border px-3 py-2.5 min-h-11 dark:bg-slate-900 dark:border-slate-700" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="text-sm font-medium" htmlFor="password">密码</label><input id="password" type="password" autoComplete="current-password" className="w-full rounded-xl border px-3 py-2.5 min-h-11 dark:bg-slate-900 dark:border-slate-700" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Btn type="submit">{loading ? '处理中…' : '登录'}</Btn>
          <button type="button" disabled={loading} onClick={() => void submit(true)} className="w-full rounded-xl border py-3 text-sm min-h-12">没有账号？点此注册</button>
        </form>
      </Card>
      <p className="text-xs text-slate-500 mt-3">{mode === 'demo' ? '提示：演示模式下任何邮箱 + 6 位以上密码都可进入本机演示，不代表已注册 Supabase 账号；配置 Supabase 后请用真实账号。' : '提示：当前已连接 Supabase，请用真实邮箱注册或登录；注册后请按邮箱提示完成确认。'}</p>
    </div>
  )
}
