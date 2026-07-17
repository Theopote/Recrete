# 产品聚焦：建筑改造能力优先

> 路线图试用阶段后的战略调整：**先把改造方案做深做准**，平台周边（试用运营、知识库 CMS、Dashboard 装饰、协作流程）往后放。

## 核心判断

Recrete 的差异化不在「又一个 AI 聊天窗口」，而在：

**上传资料 → 理解建筑 → 诊断问题 → 生成可讨论的改造方案**

当前瓶颈不是 UI 不够多，而是 **证据链断裂**——文档分析、诊断、方案、Building Memory 各跑各的，方案容易变成泛泛模板。

## 优先级（只做这些）

### P0 · 证据闭环（进行中）

| 项 | 状态 | 说明 |
|----|------|------|
| 文档/证据注入诊断 prompt | ✅ | `load-renovation-context.ts` + 增强 `buildDiagnosisPrompt` |
| 文档/证据/诊断注入方案 prompt | ✅ | 增强 `buildStrategyPrompt` |
| Building Memory LLM 合成 | ✅ | `synthesizeBuildingMemory`（有 OpenAI Key 时） |
| 方案迭代 LLM 精修 | ✅ | `refineRenovationStrategy`（有 Key 时） |
| 合规测量 ← 图纸自动提取 | ✅ | 启发式提取 + 手动录入 + 项目存储 |
| 推荐引擎多准则评分 | ✅ | 七维加权 + 贡献分解 + 推荐理由 |

### P1 · 方案专业可信度

| 项 | 状态 | 说明 |
|----|------|------|
| 统一 light / medium / deep 三档输出 schema | ✅ | `types/strategy-profile.ts` + `normalizeStrategyBatch` |
| 空间策略与 drawing graph 关联 | ✅ | `strategy-drawing-linker` + Strategy Lab UI |
| 造价 Cost & Risk 接入 cost-estimator | ✅ | 案例/基准驱动；种子数据需标注 |

### P2 · 交付物

| 项 | 状态 | 说明 |
|----|------|------|
| 方案条件化报告（引用选中策略 + 合规 remediation） | ✅ | `strategy-conditioned-report.ts` + Reports 策略选择器 |
| 诊断 executive summary 默认开启 | ✅ | 规则模板 / OpenAI 直连；不依赖 `LANGCHAIN_ENABLED` |

## 明确暂缓（往后放）

| 模块 | 路径 | 原因 |
|------|------|------|
| AI Command Center 装饰 | `app/dashboard` | 不提升方案质量 |
| 全局列表页 | `app/survey`, `app/strategies` 等 | 工作在项目内完成 |
| 知识库文章 CMS | `app/knowledge` | 弱耦合生成 |
| 材料价/成本记录后台 | `app/knowledge/cost-*` | ✅ 估算前同步材料价 + 成本记录校准基准 |
| BIM Viewer 深度 | `BimViewerSection` | 持久化与 MEP 碰撞已有；与方案内容深度关联待 P1 |
| 协作/评审流程扩展 | `CollaborationSection` | 轻量留言够用 |
| 正式 RBAC / 邀请流 | 阶段四 | 用户量 &lt; 3 家不需要 |
| Pinecone / 完整 E2E 测试 | 阶段二/三 | smoke:core 够用 |

> **试用运营文档**（`docs/trial/`）与产品能力分开管理：第二家试用前仍需维护，见 [docs/README.md](./README.md) 与 [trial/README.md](./trial/README.md)。

## 验收标准（改造能力）

用 **1 个真实旧改项目**（含 ≥2 份已分析文档）验证：

1. 诊断项 `evidence` 字段引用文档发现（非空泛）
2. 三档方案的 `structuralStrategy` / `spatialStrategy` 回应具体诊断
3. Building Memory 的 `knownFacts` 含文档要点
4. 方案迭代后内容实质变化（非仅 append 一句 instruction）
5. `npm run smoke:core` 5/5 + `npm test` 通过

## 关键文件

```
lib/ai/renovation-context.ts      # 证据/文档/诊断格式化
lib/ai/load-renovation-context.ts # 加载 evidence 注入 prompt
lib/ai/prompts.ts                 # 诊断/方案 prompt
lib/ai/openai-service.ts          # LLM 诊断/方案/记忆/迭代
lib/ai/agents/building-memory-agent.ts
lib/ai/agents/strategy-agent.ts
lib/ai/workflow/document-ingest-workflow.ts
lib/ai/workflow/diagnosis-workflow.ts
lib/ai/workflow/strategy-workflow.ts
lib/ai/strategy-schema.ts
lib/ai/strategy-drawing-linker.ts
components/projects/sections/StrategiesSection.tsx
```

## 开发原则

- **一次只改一条证据链**，改完跑 smoke
- 有 Key 走 LLM，无 Key 走模板 mock — 不 silent fallback 掩盖质量
- 新功能先问：「这能让建筑师多信方案 10% 吗？」

---

*文档版本：建筑改造能力聚焦 · 2026-07 · 与试用运营文档并行维护*
