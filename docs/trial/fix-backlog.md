# 试用修复 Backlog 模板

> 试用结束后填写。P0 必须清空后才能邀请第二家事务所。  
> 状态：`open` | `in_progress` | `done` | `wontfix`

## P0 · 阻塞（必须立即修）

| ID | 问题 | 来源（反馈/观察） | 状态 | 负责人 | 备注 |
|----|------|-------------------|------|--------|------|
| P0-001 | _示例：生成方案后页面空白_ | 用户 A · 阻塞反馈 | open | | |

## P1 · 严重

| ID | 问题 | 来源 | 状态 | 备注 |
|----|------|------|------|------|
| P1-001 | | | open | |

## P2 · 体验 / 文案

| ID | 问题 | 来源 | 状态 | 备注 |
|----|------|------|------|------|
| P2-001 | 英文残留 | 已知问题 | in_progress | 主流程已 i18n；次要标签待补 |
| P2-002 | 注册默认 viewer | 已知问题 | open | 第二家用 `trial:create-org` 规避 |

## P3 · 愿望 / 阶段二以后

| ID | 问题 | 状态 | 备注 |
|----|------|------|------|
| P3-001 | 邮件邀请同事 | open | 见 [stage2-deferral-checklist.md](../stage2-deferral-checklist.md) |
| P3-002 | 组织成员 CRUD UI | open | 只读列表已有，增删改阶段四 |

## 已关闭（第 6 个月修复记录）

| ID | 问题 | 修复说明 | 验证 |
|----|------|----------|------|
| FIX-001 | `updateBuildingMemory` DB 不持久 | prisma upsert + analysis run | smoke:core ✓ |
| FIX-002 | 方案版本历史 mock-only | `StrategyVersion` Prisma 持久化 | 单元测试 ✓ |
| FIX-003 | Building Memory 历史 | `BuildingMemoryHistory` + UI 面板 | 手动 ✓ |
| FIX-004 | 方案证据链 | `strategy-evidence-linker` + 策略卡片展示 | 单元测试 ✓ |

---

*在试用结束后，用 `npm run trial:summary` 生成的报告填充上表。*
