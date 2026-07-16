# 部署指南 · Vercel + PostgreSQL + Cloudflare R2

> 路线图第 1 个月验收项：事务所随时能打开的公网地址，重启后数据仍在。

## 推荐架构

| 组件 | 推荐服务 | 说明 |
|------|----------|------|
| 前端 + API | [Vercel](https://vercel.com) | Next.js 15 原生支持 |
| 数据库 | [Neon](https://neon.tech) | 托管 PostgreSQL，免费档可试用 |
| 文件存储 | [Cloudflare R2](https://dash.cloudflare.com) | S3 兼容，免费额度大、无出站流量费 |
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

验收通过应显示 `Result: 9 passed, 0 failed`。

### Neon（生产推荐）

1. 在 [neon.tech](https://neon.tech) 创建项目，复制 **Connection string**（带 `?sslmode=require`）
2. 设为 Vercel 环境变量 `DATABASE_URL`

## 2. 准备文件存储（Cloudflare R2）

Vercel Serverless 的本地磁盘不持久，**生产环境必须配置 S3 兼容存储**。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → 创建 Bucket（如 `recrete-uploads`）
2. Bucket **Settings → Public access** 开启公开访问
3. **Manage R2 API Tokens** → 创建 Token（Object Read & Write）
4. 记录以下值，填入 Vercel 环境变量：

| 变量 | 来源 |
|------|------|
| `S3_BUCKET` | Bucket 名称 |
| `S3_ACCESS_KEY_ID` | Token 的 Access Key ID |
| `S3_SECRET_ACCESS_KEY` | Token 的 Secret Access Key |
| `S3_ENDPOINT` | `https://xxxxx.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL_PREFIX` | Bucket 公开 URL（如 `https://pub-xxxx.r2.dev`） |
| `S3_FORCE_PATH_STYLE` | `true`（R2 必须） |
| `STORAGE_PROVIDER` | `s3` |

## 3. 部署到 Vercel

```bash
# 或在 GitHub 连接仓库后于 Vercel Dashboard 导入项目
npx vercel
```

### 必填环境变量

| 变量 | 示例 | 说明 |
|------|------|------|
| `DATABASE_URL` | `postgresql://...` | Neon 连接串 |
| `USE_DATABASE` | `true` | **必须** |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | 部署后的公网 URL（先占位，部署后回填） |
| `NEXTAUTH_SECRET` | 随机 32+ 字符 | `openssl rand -base64 32` |
| `JOB_RUNNER_SECRET` | 随机字符串 | 内部任务 API |
| `STORAGE_PROVIDER` | `s3` | 生产必须 |
| `S3_*` | 见上节 | Cloudflare R2 |
| `AI_SERVICE` | `mock` 或 `openai` | 试用阶段可用 `mock` |

生成 `NEXTAUTH_SECRET`：

```bash
openssl rand -base64 32
```

### 部署步骤

1. Vercel → **Add New → Project** → 导入 GitHub 仓库
2. 先填好环境变量，再点 **Deploy**
3. 部署成功后复制真实网址，回到 **Settings → Environment Variables** 更新 `NEXTAUTH_URL`
4. **Deployments** → 最新部署 → `···` → **Redeploy**

## 4. 初始化生产数据库

Vercel 不会自动建表或灌入演示数据，需在本地执行一次：

```bash
# 方式一：一行命令（推荐）
USE_DATABASE=true DATABASE_URL="你的Neon连接串" npm run db:prod-init

# 方式二：分步执行
USE_DATABASE=true DATABASE_URL="..." npm run db:push
USE_DATABASE=true DATABASE_URL="..." npm run db:seed
```

## 5. 验收清单（第 1 个月）

- [ ] `npm run db:acceptance` 本地全部通过
- [ ] 公网 URL 可登录 `lin.wei@recrete.io` / `recrete2026`
- [ ] 公网 URL 可登录 `test.other@recrete.io` / `recrete2026`（仅见 org-2 项目）
- [ ] 两个账号互相无法打开对方项目详情页
- [ ] 关闭本地电脑后，公网地址仍可访问且数据保留
- [ ] 上传文件后刷新仍在（R2 存储生效）
- [ ] `npm run smoke:trial-prep` 无报错（需配置生产环境变量）

## 6. 演示账号

| 邮箱 | 事务所 | 密码 |
|------|--------|------|
| `lin.wei@recrete.io` | org-1 | `recrete2026` |
| `test.other@recrete.io` | org-2 | `recrete2026` |

## 7. 常见问题

**构建失败 `prisma generate`**  
确保 `package.json` 的 `postinstall` 包含 `prisma generate`（已配置）。

**构建失败 ESLint `react-hooks/rules-of-hooks`**  
非 React 函数不要用 `use` 前缀命名（如 `useDatabase`），已修复。

**登录后数据为空**  
检查 `USE_DATABASE=true` 且已执行 `npm run db:prod-init`。

**上传文件后过一会儿打不开**  
检查 `STORAGE_PROVIDER=s3` 及全部 `S3_*` 变量，改完后 Redeploy。

**Serverless 冷启动慢**  
Neon 免费档有休眠；首次请求可能慢 1–2 秒，可升级或保持 ping。

**试用反馈**  
试用期间保持 `NEXT_PUBLIC_TRIAL_FEEDBACK=true`；详见 `docs/trial-pilot-guide.md`。
