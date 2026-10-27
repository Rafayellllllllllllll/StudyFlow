import { describe, expect, it } from 'vitest'
import { validateImportJson, mistakesToCsv, safeImageName, validateImageFile } from './importExport'
import { mistakeSchema } from './validate'

describe('导入校验与表单校验', () => {
  it('合法 JSON 通过，冲突标题被提示', () => {
    const text = JSON.stringify({ mistakes: [{ subject_name: '数学', title: '已有题', content: 'x', answer: '1', type: '选择题', difficulty: '简单' }] })
    const r = validateImportJson(text, ['已有题'])
    expect(r.ok).toBe(true)
    expect(r.conflicts).toEqual(['已有题'])
  })
  it('非法 JSON 与缺字段都不通过，且不返回可导入项', () => {
    expect(validateImportJson('{bad', []).ok).toBe(false)
    const r = validateImportJson(JSON.stringify({ mistakes: [{ subject_name: '数学', title: '', content: 'x', answer: '1', type: '选择题', difficulty: '简单' }] }), [])
    expect(r.ok).toBe(false)
    expect(r.items).toHaveLength(0)
  })
  it('CSV 转义引号与逗号，不破坏列结构', () => {
    const csv = mistakesToCsv([{ subject_name: '数学', title: 'a"b,c', content: '', answer: '', analysis: '', knowledge_points: [], type: '选择题', difficulty: '简单', mastery: '未掌握', favorite: false, created_at: '2026-10-20', deleted_at: null } as never])
    expect(csv).toContain('"a""b,c"')
  })
  it('表单校验：空学科与空题目不通过', () => {
    const r = mistakeSchema.safeParse({ subject_name: '', title: '', content: '', answer: '', analysis: '', knowledge_points: '', type: '', difficulty: '中等', note: '' })
    expect(r.success).toBe(false)
  })
  it('图片校验：类型与大小都不合规时拒绝', () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'a.png', { type: 'image/png' })
    expect(validateImageFile(big)).toMatch('5MB')
    const bad = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    expect(validateImageFile(bad)).toMatch('PNG')
    expect(safeImageName('a b.exe')).toMatch(/\.png$/)
  })
})
