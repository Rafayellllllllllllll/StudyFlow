# StudyFlow · 智能学习管理 Web 应用

手机优先的个人学习管理应用：错题管理、间隔复习、学科/知识点统计、复习计划、每日任务、学习日历、学习记录、导入导出、个人设置、管理与诊断，共 14 个页面路由（底部导航主入口 5 个，其余在“更多”里）。

**重要说明：本项目与错题本项目完全分开。** 不要把它推到错题本仓库 ZiDongHuaStudy，也不要默认复用错题本的 Supabase 项目 cuotiben。

## 技术栈

React + TypeScript + Vite + Tailwind CSS 4、React Router、Supabase（Auth / PostgreSQL / Storage）、React Hook Form + Zod、TanStack Query、Vitest + React Testing Library。

## 本地运行

```bash
npm install
npm run dev      # 开发
npm run build    # 类型检查 + 生产构建
npm test         # vitest run
```

## 两种运行模式（诚实标注）

- **未配置 Supabase**：应用自动进入演示模式，顶部和登录页会明确写“演示模式：未连接 Supabase，数据只存在本机浏览器”。演示数据不是数据库查询结果，换设备或清浏览器数据会丢失，请用导入导出页备份。
- **已配置 Supabase**：复制 `.env.example` 为 `.env`，填入该项目（StudyFlow 专用新项目）的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。**绝不要填 service_role 密钥、数据库密码，也不要把任何真实密钥提交到 Git。**

## 数据库初始化与升级

1. 在 Supabase 新项目里打开 SQL 编辑器。
2. 依次执行 `supabase/migrations/001_init.sql`，再执行 `supabase/migrations/002_storage.sql`。
3. 两个文件都可重复执行（`IF NOT EXISTS`、先删策略再建策略），升级时直接重跑即可。
4. 表：profiles、subjects、mistakes、knowledge_points、mistake_knowledge_points、review_records、study_sessions、daily_tasks、user_settings；全部私有表启用 RLS，策略只放行本人数据；Storage 用私有 bucket `mistake-images`，路径第一段必须是本人 user_id。
5. 验证：进应用的“管理与诊断”页，点“检查 Supabase 连接 / 表访问”，看返回结果；不要只看构建成功就认定数据库通了。

## 复习算法说明

见 `src/lib/review.ts` 与复习计划页：默认间隔 1、3、7、15、30 天，答对延长、答错缩短为 1 天、连续答错优先；可在个人设置里改间隔，也可手动改任意一题的下次复习日期。**这只是初始版本的安排规则，不是经过医学或教育学验证的最佳算法。**

## 部署前置条件（阶段 G，当前均未完成）

- 用户给出 StudyFlow 的新 GitHub 仓库名，并把该仓库加进 Muse 的 GitHub App 可访问范围；
- 用户新建 StudyFlow 专用的 Supabase 项目并通过安全表单提供地址与 anon 密钥（不在聊天里发密钥）；
- 跑完上面两个 migration，配置环境变量后重新构建验证。

当前状态：**尚未推送到 GitHub、尚未部署**。上面列出的是待办，不是已完成项。

## 已知限制

- Playwright 未跑：当前环境未确认浏览器端测试支持，因此不声称跑过端到端测试；单元与组件级测试见 `npm test`。
- Supabase 模式下的完整端到端联调（真实登录、真实 Storage 上传、RLS 边界）需在用户提供 StudyFlow 专用凭证并跑完 migration 后才能实测；代码里已按该路径实现并在失败时明确报错、不静默回退假装成功。
- 演示模式下图片以本机数据形式保存；Supabase 模式下图片走私有 bucket 并用 7 天有效期的签名链接展示。
