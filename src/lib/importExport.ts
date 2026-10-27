import { z } from 'zod'
import type { Mistake } from './types'

const itemSchema = z.object({
  subject_name: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  answer: z.string().min(1),
  analysis: z.string().optional().default(''),
  knowledge_points: z.array(z.string()).optional().default([]),
  type: z.string().min(1),
  difficulty: z.enum(['简单', '中等', '困难']),
  mastery: z.enum(['未掌握', '部分掌握', '已掌握']).optional().default('未掌握'),
  favorite: z.boolean().optional().default(false),
  note: z.string().optional().default(''),
})
const fileSchema = z.object({ version: z.literal(1).optional(), mistakes: z.array(itemSchema).min(1, '文件里没有错题').max(1000, '一次最多导入 1000 条') })

export type ImportPreviewItem = z.infer<typeof itemSchema>
export interface ImportResult {
  ok: boolean
  items: ImportPreviewItem[]
  errors: string[]
  conflicts: string[] // 与已有题目相同的标题
}

export function validateImportJson(text: string, existingTitles: string[]): ImportResult {
  try {
    const parsed: unknown = JSON.parse(text)
    const data = Array.isArray(parsed) ? { mistakes: parsed } : parsed
    const r = fileSchema.safeParse(data)
    if (!r.success) {
      return { ok: false, items: [], errors: r.error.issues.map((i) => `${i.path.join('.') || '文件'}：${i.message}`), conflicts: [] }
    }
    const set = new Set(existingTitles)
    const conflicts = r.data.mistakes.filter((m) => set.has(m.title)).map((m) => m.title)
    return { ok: true, items: r.data.mistakes, errors: [], conflicts }
  } catch {
    return { ok: false, items: [], errors: ['JSON 格式不正确，请检查括号和引号'], conflicts: [] }
  }
}

export function mistakesToJson(list: Mistake[]): string {
  return JSON.stringify({ version: 1, exported_at: new Date().toISOString(), mistakes: list.filter((m) => !m.deleted_at).map((m) => ({
    subject_name: m.subject_name, title: m.title, content: m.content, answer: m.answer,
    analysis: m.analysis, knowledge_points: m.knowledge_points, type: m.type,
    difficulty: m.difficulty, mastery: m.mastery, favorite: m.favorite, note: m.note,
  })) }, null, 2)
}

export function csvEscape(v: string): string {
  return `"${String(v).replace(/"/g, '""')}"`
}
export function mistakesToCsv(list: Mistake[]): string {
  const head = ['学科', '标题', '题目', '答案', '解析', '知识点', '类型', '难度', '掌握程度', '收藏', '创建时间']
  const rows = list.filter((m) => !m.deleted_at).map((m) => [
    m.subject_name, m.title, m.content, m.answer, m.analysis, m.knowledge_points.join('、'),
    m.type, m.difficulty, m.mastery, m.favorite ? '是' : '否', m.created_at,
  ].map(csvEscape).join(','))
  return '\uFEFF' + [head.join(','), ...rows].join('\n')
}

export function downloadText(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safeImageName(original: string): string {
  const ext = original.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png'
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
}
export function validateImageFile(file: File): string | null {
  const okTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!okTypes.includes(file.type)) return '只支持 PNG、JPG、WEBP、GIF 图片'
  if (file.size > 5 * 1024 * 1024) return '图片不能超过 5MB'
  return null
}
