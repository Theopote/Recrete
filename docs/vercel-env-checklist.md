# Vercel 环境变量核对清单

> 部署 / 试用前对照本清单配置 **Vercel → Settings → Environment Variables**。  
> 建议环境范围：**Production**（试用阶段 Preview 可同步一份）。  
> 相关文档：[deployment.md](./deployment.md) · [trial/known-issues.md](./trial/known-issues.md)

---

## 使用说明

1. 将下方 `YOUR_...` 占位符替换为真实值。
2. 生成随机密钥（本地终端）：

```bash
openssl rand -base64 32
```

3. 首次部署成功后，把 `NEXTAUTH_URL` 更新为真实公网地址，再 **Redeploy** 一次。
4. 生产库初始化（只需执行一次）：

```bash
USE_DATABASE=true DATABASE_URL="你的Neon连接串" npm run db:prod-init
```

5. 配置完成后可运行 `npm run smoke:trial-prep` 做自动化核对（需在本机注入与 Vercel 相同的环境变量）。

---

## A. 必填（缺一项可能导致部署失败或数据丢失）

复制到 Vercel，替换占位符：

```env
# ── 数据库 ──
USE_DATABASE=true
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require

# ── 认证 ──
NEXTAUTH_URL=https://YOUR-APP.vercel.app
NEXTAUTH_SECRET=PASTE_OPENSSL_RAND_BASE64_32_HERE

# ── 内部任务 API ──
JOB_RUNNER_SECRET=PASTE_ANOTHER_RANDOM_STRING_HERE

# ── 文件存储（Cloudflare R2，Vercel 必填）──
STORAGE_PROVIDER=s3
S3_BUCKET=recrete-uploads
S3_REGION=auto
S3_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_PUBLIC_URL_PREFIX=https://pub-YOUR_BUCKET_ID.r2.dev
S3_FORCE_PATH_STYLE=true
```

| 变量 | 核对要点 |
|------|----------|
| `USE_DATABASE` | 必须是 `true` |
| `DATABASE_URL` | Neon 连接串，建议带 `?sslmode=require` |
| `NEXTAUTH_URL` | 与 Vercel 公网 URL **完全一致**（含 `https://`，无末尾 `/`） |
| `NEXTAUTH_SECRET` | 不得使用 dev 默认值 `recrete-dev-secret-change-in-production` |
| `JOB_RUNNER_SECRET` | 不得使用 dev 默认值 `recrete-dev-job-secret` |
| `STORAGE_PROVIDER` | 必须是 `s3`，不能是 `local` |
| `S3_FORCE_PATH_STYLE` | Cloudflare R2 必须为 `true` |

### R2 变量从哪里找

| 变量 | 来源 |
|------|------|
| `S3_BUCKET` | Cloudflare R2 → 创建的 Bucket 名称 |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2 → Manage R2 API Tokens |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL_PREFIX` | Bucket Settings → Public access 公开 URL |

---

## B. 强烈推荐（试用质量）

```env
# ── AI（真实 LLM，非 mock）──
AI_SERVICE=auto
OPENAI_API_KEY=sk-...

# ── 试用反馈 widget ──
NEXT_PUBLIC_TRIAL_FEEDBACK=true
```

| 变量 | 核对要点 |
|------|----------|
| `AI_SERVICE` | `auto` = 有 Key 时用 OpenAI，否则回退 mock |
| `OPENAI_API_KEY` | 试用前务必配置，否则诊断/方案为模板内容 |
| `NEXT_PUBLIC_TRIAL_FEEDBACK` | 试用期间保持 `true`（修改后需 Redeploy） |

---

## C. 建议保留默认值（一般不用改）

```env
AI_DAILY_ORG_LIMIT=50
AI_MONTHLY_ORG_LIMIT=500
AI_REQUEST_TIMEOUT_MS=60000
DOCUMENT_ANALYSIS_MAX_PAGES=8
DOCUMENT_ANALYSIS_TIMEOUT_MS=120000
OPENAI_MODEL=gpt-4o-mini
OPENAI_MODEL_FAST=gpt-4o-mini
OPENAI_MODEL_REASONING=gpt-4o
OPENAI_MODEL_VISION=gpt-4o
OPENAI_MODEL_COMPLIANCE=gpt-4o-mini
OPENAI_MODEL_COPILOT=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VISION_PROVIDER=openai
LANGCHAIN_ENABLED=false
```

---

## D. 可选（按需开启）

```env
# ── 邮件（密码重置）──
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Recrete <noreply@recrete.io>

# ── 向量检索（不配则用本地 TF-IDF）──
PINECONE_API_KEY=
PINECONE_INDEX=recrete-knowledge
PINECONE_NAMESPACE=default

# ── Anthropic 视觉（默认 OpenAI 时可跳过）──
ANTHROPIC_API_KEY=
ANTHROPIC_VISION_MODEL=claude-sonnet-4-20250514

# ── 后台任务队列（多 Vercel 实例才需要）──
REDIS_URL=

# ── OpenAI 代理 / 自定义端点 ──
OPENAI_BASE_URL=
```

---

## E. 不要设置的值（常见踩坑）

| 错误配置 | 后果 |
|----------|------|
| `USE_DATABASE=false` | 重启后数据不持久 |
| `STORAGE_PROVIDER=local` | Vercel 上上传文件不持久（**P0**） |
| `NEXTAUTH_URL=http://localhost:3000` | 登录回调失败 |
| `NEXTAUTH_SECRET=recrete-dev-secret-change-in-production` | 安全风险 |
| `S3_FORCE_PATH_STYLE=false`（R2） | 上传/读取失败 |

---

## F. 部署后验收清单

按顺序打勾：

- [ ] Vercel Deployments 最新一次 Build 成功（无 TypeScript error）
- [ ] 公网打开 `https://YOUR-APP.vercel.app/login` 可访问
- [ ] 登录 `lin.wei@recrete.io` / `recrete2026` 成功
- [ ] 登录 `test.other@recrete.io` / `recrete2026` 成功
- [ ] 两个账号互相无法打开对方项目详情页（租户隔离）
- [ ] 进入 `proj-demo` → Strategy Lab → 生成方案成功
- [ ] 方案卡片出现「档位方案结构」与「图纸关联房间」
- [ ] 上传一份 PDF → 刷新后文件仍在（R2 生效）
- [ ] 关闭本地电脑后公网仍可访问
- [ ] （可选）Settings 页试用反馈 widget 可见

---

## G. 自动化核对

在本地注入与 Vercel 相同的环境变量后：

```bash
npm run smoke:trial-prep
```

期望：**10/10 passed**。`OPENAI_API_KEY` 未配置时仅 warn，不算 fail。

本地开发门禁（push 前）：

```bash
npm run build
npm run smoke:core    # 期望 5/5
npm test              # 期望全部通过
```

---

## H. 推荐操作顺序

```
1. Vercel → Settings → Environment Variables → 粘贴 A + B 段
2. Push 代码或手动 Deploy
3. 复制真实公网 URL → 更新 NEXTAUTH_URL → Redeploy
4. 本地执行 npm run db:prod-init（指向 Neon）
5. 浏览器走 F 段验收清单
6. （可选）npm run smoke:trial-prep
```

---

## I. 演示账号

| 邮箱 | 事务所 | 密码 |
|------|--------|------|
| `lin.wei@recrete.io` | org-1 | `recrete2026` |
| `test.other@recrete.io` | org-2 | `recrete2026` |

---

*文档版本：2026-07 · 与 [.env.example](../.env.example) 同步维护*
