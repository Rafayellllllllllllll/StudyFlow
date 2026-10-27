import { useNavigate } from 'react-router-dom'
import { Card, PageTitle } from '../components/ui'
import { MistakeForm } from '../components/MistakeForm'

export default function MistakeNew() {
  const nav = useNavigate()
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <PageTitle title="新增错题" sub="学科和类型都可以自己写，不用从固定列表里选；保存后统计里会自动出现这个学科。" />
      <Card><MistakeForm onSaved={(id) => nav(`/mistakes/${id}`)} /></Card>
    </div>
  )
}
