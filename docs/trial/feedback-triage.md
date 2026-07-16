# 反馈分流工作流 · 第 5 个月 → 第 6 个月

> 试用结束后，把散落的反馈变成**可执行的修复清单**。不要跳过这一步直接改代码。

## 1. 收集素材（试用结束后 24 小时内）

| 来源 | 操作 |
|------|------|
| 应用内反馈 | Settings 导出 CSV，或 `GET /api/trial-feedback?format=csv` |
| 观察手册记录 | 合并 [observer-playbook.md](./observer-playbook.md) 会话表格中的卡点与原文 |
| 你自己的笔记 | 补充用户没说出口但你看出来的犹豫点 |

## 2. 自动生成分流报告

```bash
# 内存模式（本地演示反馈）
npm run trial:summary

# 生产库（指向试用事务所 org）
USE_DATABASE=true DATABASE_URL="..." npm run trial:summary -- --org org-trial-xxx

# 指定输出路径
npm run trial:summary -- --out docs/trial/feedback-report.md
```

报告包含：

- **P0 阻塞项**（`isBlocker=true`）
- 按类型 / 步骤分布
- AI 方案平均分
- 文案问题与卡点候选

## 3. 人工交叉核对（必做）

自动报告**不能替代**你的观察。对照检查：

1. 是否有 P0 没点「阻塞」但确实无法继续？→ 手动升为 P0
2. 是否有重复反馈可合并？→ 合并为一条 backlog
3. 是否有个别「愿望」被误标为卡点？→ 降为 P3

把结论写入 [fix-backlog.md](./fix-backlog.md)。

## 4. 排期原则（路线图第 6 个月）

```
P0（阻塞）> P1（严重误导/数据错）> P2（体验/文案）> P3（愿望清单）
```

- **一批只修一个主题**（例如「只修上传持久化」），修完跑 `npm run smoke:core`
- 真实用户量 &lt; 5 家时，**不要启动**阶段二（真队列、完整 RBAC）— 见 [stage2-deferral-checklist.md](../stage2-deferral-checklist.md)
- 修完 P0/P1 后再考虑第二家事务所试用

## 5. 验收闭环

每批修复后：

```bash
npm run smoke:core
npm test
# 生产前
npm run smoke:trial-prep
```

更新 [known-issues.md](./known-issues.md) 中已关闭项。

## 6. 第二家事务所

P0/P1 收口后，发送 [second-firm-intro.md](./second-firm-intro.md)，并用：

```bash
USE_DATABASE=true DATABASE_URL="..." npm run trial:create-org -- \
  --name "事务所名称" \
  --email "lead@firm.com" \
  --password "临时密码"
```

创建隔离 org + architect 账号。邮件模板见 [second-firm-invite-email.md](./second-firm-invite-email.md)。

---

*文档版本：2026-07 · 第 6 个月准备*
