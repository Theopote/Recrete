# Recrete 文档索引

> 按用途分类。产品代码变更后，优先更新「活文档」；历史文档见 [archive/](./archive/)。

## 开发者入门

| 文档 | 用途 |
|------|------|
| [../README.md](../README.md) | 项目概览、本地启动、环境变量、脚本 |
| [deployment.md](./deployment.md) | Vercel + Neon + Cloudflare R2 生产部署 |
| [vercel-env-checklist.md](./vercel-env-checklist.md) | **Vercel 环境变量核对清单（部署前复制粘贴）** |
| [architecture-data-layer-migration.md](./architecture-data-layer-migration.md) | BIM / 图纸分析 DB 迁移设计（代码已完成） |
| [renovation-focus.md](./renovation-focus.md) | 产品战略：改造证据链优先 |

## 事务所试用（运营）

试用相关文档已集中至 **[trial/](./trial/)** 目录：

| 文档 | 受众 | 何时用 |
|------|------|--------|
| [trial/pilot-guide.md](./trial/pilot-guide.md) | 事务所用户 | 发给试用方上手指南 |
| [trial/known-issues.md](./trial/known-issues.md) | 双方 | 试用前透明告知已知限制 |
| [trial/second-firm-intro.md](./trial/second-firm-intro.md) | 第二家事务所 | 一页产品介绍 / 邮件附件 |
| [trial/second-firm-invite-email.md](./trial/second-firm-invite-email.md) | 运营 | 邀请邮件模板 |
| [trial/observer-playbook.md](./trial/observer-playbook.md) | 内部观察员 | 试用当天操作清单 |
| [trial/feedback-triage.md](./trial/feedback-triage.md) | 内部 | 试用后反馈 → 修复优先级 |
| [trial/fix-backlog.md](./trial/fix-backlog.md) | 内部 | 修复任务跟踪表 |

## 决策记录

| 文档 | 用途 |
|------|------|
| [stage2-deferral-checklist.md](./stage2-deferral-checklist.md) | 是否启动阶段二/三/四（队列、E2E、正式 RBAC） |

## 关键脚本（试用相关）

```bash
npm run smoke:trial-prep      # 部署前环境检查
npm run trial:create-org      # 为第二家创建独立 org + architect 账号
npm run trial:summary         # 导出试用反馈汇总
npm run db:acceptance         # 本地 DB 一键验收
```

## 口径说明

- **自助邀请注册**：MVP 阶段未实现；用 `trial:create-org` 手动开户（原计划见 [archive/mvp-roadmap-extract.txt](./archive/mvp-roadmap-extract.txt) 第 3 月，实际推迟到阶段四）。
- **产品 vs 试用运营**：`renovation-focus.md` 管产品优先级；`trial/` 管试用交付，二者并行维护。

## 历史归档

| 文档 | 说明 |
|------|------|
| [archive/mvp-roadmap-extract.txt](./archive/mvp-roadmap-extract.txt) | 六个月路线图原文（部分已偏离） |
| [archive/PROJECT_REVIEW_REPORT-2026-07.md](./archive/PROJECT_REVIEW_REPORT-2026-07.md) | 2026-07 代码审查快照 |

---

*索引版本：2026-07*
