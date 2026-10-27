import { z } from 'zod'

export const mistakeSchema = z.object({
  subject_name: z.string().trim().min(1, '请填写学科（可自定义，例如数学）').max(30, '学科最多 30 字'),
  title: z.string().trim().min(1, '请填写题目标题').max(100, '标题最多 100 字'),
  content: z.string().trim().min(1, '请填写题目内容').max(5000, '题目内容最多 5000 字'),
  answer: z.string().trim().min(1, '请填写答案').max(5000, '答案最多 5000 字'),
  analysis: z.string().max(5000, '解析最多 5000 字'),
  knowledge_points: z.string().max(500, '知识点用逗号分隔，最多 500 字'),
  type: z.string().trim().min(1, '请填写错题类型（可自定义）').max(30, '类型最多 30 字'),
  difficulty: z.enum(['简单', '中等', '困难']),
  note: z.string().max(2000, '备注最多 2000 字'),
})
export type MistakeForm = z.infer<typeof mistakeSchema>

export const subjectSchema = z.object({
  name: z.string().trim().min(1, '请填写学科名').max(30, '学科最多 30 字'),
})
export const sessionSchema = z.object({
  title: z.string().trim().min(1, '请填写学习内容').max(100, '最多 100 字'),
  minutes: z.coerce.number().int('请输入整数分钟').min(1, '至少 1 分钟').max(1440, '一天最多 1440 分钟'),
  date: z.string().min(1, '请选择日期'),
})
export const settingsSchema = z.object({
  daily_goal_minutes: z.coerce.number().int().min(0).max(1440),
  review_intervals: z.string().min(1, '请填写间隔，例如 1,3,7,15,30'),
})
