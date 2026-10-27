import { Link } from 'react-router-dom'
import { Card, PageTitle } from '../components/ui'

const ITEMS = [
  { to: '/mistakes/new', label: '新增错题', desc: '新增一道错题，可自定义学科和类型' },
  { to: '/knowledge', label: '知识点统计', desc: '按知识点汇总错题与掌握情况' },
  { to: '/tasks', label: '每日任务', desc: '生成并完成今日复习任务' },
  { to: '/calendar', label: '学习日历', desc: '按日期查看学习记录、任务与到期复习' },
  { to: '/sessions', label: '学习记录', desc: '记学习时长与内容' },
  { to: '/import-export', label: '数据导入导出', desc: 'JSON / CSV 导出，JSON 导入预览校验' },
  { to: '/settings', label: '个人设置', desc: '主题、目标、复习间隔、学科管理' },
  { to: '/admin', label: '管理与诊断', desc: '运行模式、计数、Supabase 连接检查' },
  { to: '/login', label: '登录 / 注册', desc: '演示模式或 Supabase Auth 登录' },
]

export default function More() {
  return (
    <div className="space-y-3">
      <PageTitle title="更多功能" sub="底部导航只放 5 个主入口，其余功能都在这里。" />
      <div className="space-y-2">{ITEMS.map((it) => (
        <Link key={it.to} to={it.to}><Card className="flex justify-between items-center"><span><span className="font-medium text-sm block">{it.label}</span><span className="text-xs text-slate-500">{it.desc}</span></span><span aria-hidden>›</span></Card></Link>
      ))}</div>
    </div>
  )
}
