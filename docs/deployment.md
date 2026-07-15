# 部署指南 · Vercel + PostgreSQL

> 路线图第 1 个月验收项：事务所随时能打开的公网地址，重启后数据仍在。

## 推荐架构

| 组件 | 推荐服务 | 说明 |
|------|----------|------|
| 前端 + API | [Vercel](https://vercel.com) | Next.js 15 原生支持 |
| 数据库 | [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) | 托管 PostgreSQL，免费档可试用 |
| 邮件（可选） | Resend / SendGrid / 企业 SMTP | 密码重置 |
| 后台任务（可选） | Upstash Redis | `REDIS_URL` + `npm run jobs:worker` |

内存模式（`USE_DATABASE=false`）仅适合本地演示，**事务所试用必须启用数据库**。

## 1. 准备 PostgreSQL

### 本地（开发 / 验收）

```bash
npm run db:up          # Docker Postgres on :5432
cp .env.example .env
# 编辑 .env:
#   USE_DATABASE=true
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recrete?schema=public

npm run db:acceptance  # push + seed + 验收
```

### Neon（生产推荐）

1. 在 Neon 创建项目，复制 **Connection string**（带 `?sslmode=require`）
2. 设为 Vercel 环境变量 `DATABASE_URL`

### Supabase

1. Project Settings → Database → Connection string (URI)
2. 使用 **Session mode** 或 **Transaction mode** 连接串均可（Prisma 推荐 pooler 连接用于 serverless）

## 2. 部署到 Vercel

```bash
# 安装 Vercel CLI（可选）
npx vercel

# 或在 GitHub 连接仓库后于 Vercel Dashboard 导入项目
```

### 必填环境变量

| 变量 | 示例 | 说明 |
|------|------|------|
| `DATABASE_URL` | `postgresql://...` | 托管 Postgres 连接串 |
| `USE_DATABASE` | `true` | **必须** |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | 部署后的公网 URL |
| `NEXTAUTH_SECRET` | 随机 32+ 字符 | `openssl rand -base64 32` |
| `JOB_RUNNER_SECRET` | 随机字符串 | 内部任务 API |

### 首次部署后初始化数据库

在本地（指向生产 `DATABASE_URL`）或 Vercel 一次性命令：

```bash
USE_DATABASE=true DATABASE_URL="..." npm run db:push
USE_DATABASE=true DATABASE_URL="..." npm run db:seed
```

或在 Vercel **Settings → General → Build Command** 之外，用 **Deploy Hooks** / 本地脚本执行一次 seed。

> 注意：Vercel Serverless 不会在每次部署自动 seed，需手动执行一次。

## 3. 验收清单（第 1 个月）

- [ ] `USE_DATABASE=true npm run db:acceptance` 全部通过
- [ ] 公网 URL 可登录 `lin.wei@recrete.io` / `recrete2026`
- [ ] 公网 URL 可登录 `test.other@recrete.io` / `recrete2026`（仅见 org-2 项目）
- [ ] 两个账号互相无法打开对方项目详情页
- [ ] 关闭本地电脑后，公网地址仍可访问且数据保留

## 4. 演示账号

| 邮箱 | 事务所 | 密码 |
|------|--------|------|
| `lin.wei@recrete.io` | org-1 | `recrete2026` |
| `test.other@recrete.io` | org-2 | `recrete2026` |

## 5. 常见问题

**构建失败 `prisma generate`**  
确保 `package.json` 的 `postinstall` 包含 `prisma generate`（已配置）。

**登录后数据为空**  
检查 `USE_DATABASE=true` 且已执行 `db:seed`。

**Serverless 冷启动慢**  
Neon 免费档有休眠；首次请求可能慢 1–2 秒，可升级或保持 ping。

**文件上传**  
本地开发默认 `STORAGE_PROVIDER=local`。Vercel 生产环境必须配置 S3/R2（见 `.env.example` 中 `S3_*`），否则上传在重启后丢失。试用前运行 `npm run smoke:trial-prep`。

**试用反馈**  
试用期间保持 `NEXT_PUBLIC_TRIAL_FEEDBACK=true`；事务所在应用内右下角提交反馈，管理员在 Settings 导出 CSV。详见 `docs/trial-pilot-guide.md`。
