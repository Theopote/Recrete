# 数据层架构迁移：BIM 模型与图纸分析结构化存储

> 版本：1.1 · 日期：2026-06-21  
> 状态：代码完成，待数据库验收

## 1. 背景与动机

Recrete 当前在两类核心资产上存在**结构化数据落盘不足**的问题：

| 领域 | 现状 | 问题 |
|------|------|------|
| **BIM 模型** | `data/bim-models/{projectId}.json` 本地清单 | 多实例部署不可共享、无事务、与 Prisma 主数据割裂 |
| **图纸分析** | 写入 `DocumentAsset.extractedText`，知识图谱以 `--- Knowledge Graph ---` 文本块拼接 | 查询需字符串解析、无法按房间/标注检索、重复分析无结构化复用 |

类型层（`types/bim.ts`、`DrawingAnalysisResult`）与业务逻辑（`lib/bim/`、`lib/ai/vision/`）已较完整，**缺口在持久化层**。

本迁移**不**引入微服务拆分，延续「模块化单体 + 双模式数据层（DB / 文件回退）」现有惯例（参见 `lib/db/project-costs.ts`）。

## 2. 目标与非目标

### 目标

1. 将 `BimModel` 迁入 PostgreSQL（`USE_DATABASE=true` 时），保留 JSON 文件回退（demo / 无 DB 环境）。
2. 新增 `DrawingAsset` 表，结构化存储图纸 Vision 分析结果与知识图谱。
3. 文档 ingest 流程自动 upsert `DrawingAsset`；知识图谱 API 优先读结构化数据。
4. 提供一次性脚本，将已有 `data/bim-models/*.json` 导入数据库。

### 非目标（本阶段不做）

- 微服务拆分（`recrete-ai-worker` 等）
- `AIAnalysisCache`（内容哈希缓存，待 AI 调用量上升后迭代）
- 对象存储独立服务（继续使用 `lib/storage/upload`）

## 3. 数据模型设计

### 3.1 `BimModel`

对齐 `types/bim.ts` 中的 `BimModel` 接口，不缩减字段：

```prisma
enum BimModelFormat { ifc dwg dxf }
enum BimModelStatus { ready processing failed unsupported }

model BimModel {
  id           String         @id @default(cuid())
  projectId    String
  name         String
  format       BimModelFormat
  status       BimModelStatus @default(processing)
  fileUrl      String
  previewUrl   String?
  gltfUrl      String?
  fileSize     Int
  mimeType     String
  errorMessage String?
  metadata     Json?
  uploadedById String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  project Project @relation(...)
  @@index([projectId])
}
```

`metadata` 存 `BimModelMetadata`（房间、流线、造价单元等），与 TypeScript 类型一致。

### 3.2 `DrawingAsset`

一张文档的一页图纸一条记录（单页默认 `pageNumber = 1`）：

```prisma
enum DrawingType {
  floor_plan elevation section detail structural mep unknown
}

model DrawingAsset {
  id             String      @id @default(cuid())
  documentId     String
  projectId      String
  pageNumber     Int         @default(1)
  drawingType    DrawingType @default(unknown)
  scale          String?
  analysisResult Json        // DrawingAnalysisResult
  knowledgeGraph Json?       // DrawingKnowledgeGraph
  openCvResult   Json?       // OpenCV 辅助分析摘要
  modelName      String
  confidence     Float       @default(0.8)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  document DocumentAsset @relation(...)
  project  Project       @relation(...)

  @@unique([documentId, pageNumber])
  @@index([projectId])
  @@index([drawingType])
}
```

**与 `DocumentAsset` 关系**：`DrawingAsset` 是 `DocumentAsset` 的分析子实体；`aiSummary` / 人类可读 `extractedText` 仍保留在 `DocumentAsset` 供列表预览。

**与 `SourceEvidence` 关系**：证据链继续写入 `SourceEvidence`（bbox、引用），`DrawingAsset` 存完整分析 JSON，二者互补。

## 4. 代码分层

```
lib/db/
├── resolve.ts                 # USE_DATABASE 探测（已有）
├── bim-models.ts              # 双模式门面
├── prisma-bim-models.ts       # Prisma 实现
├── drawing-assets.ts          # 双模式门面
├── prisma-drawing-assets.ts   # Prisma 实现

lib/bim/
├── bim-file-store.ts          # JSON 清单回退（自 bim-model-repository 迁出）

lib/ai/knowledge/
├── drawing-asset-file-store.ts  # 图纸分析 JSON 回退
```

`lib/bim/bim-model-repository.ts` 保留为**薄兼容层**，内部委托 `lib/db/bim-models.ts`，避免大规模改 import 路径。

## 5. 业务流程变更

### 5.1 BIM 上传（无变化对用户可见）

```
POST /api/projects/{id}/bim-models
  → createBimModelFromUpload()
  → lib/db/bim-models.addBimModel()   // 原 addBimModel 直写 JSON
  → enqueueBimCadConversionJob() → CAD 转换后 updateBimModel()
```

### 5.2 文档分析 ingest

```
runDocumentIngestWorkflow()
  → analyzeDocumentAsset()
  → updateDocument(aiSummary, extractedText)   // extractedText 不再嵌入 Knowledge Graph JSON
  → 若 kind === "drawing" 且含 drawing 结果：
      upsertDrawingAsset({ analysisResult, knowledgeGraph, openCvResult, ... })
  → addSourceEvidence() / addAnalysisRun() ...
```

### 5.3 知识图谱 API

```
GET /api/projects/{id}/knowledge-graph
  → listDrawingAssetsByProject(projectId)     // 优先
  → 回退：解析 DocumentAsset.extractedText   // 兼容历史数据
  → mergeDrawingGraphs()

POST /api/projects/{id}/knowledge-graph
  → 逐文档 runDocumentIngestWorkflow()       // 落库 DocumentAsset + DrawingAsset
  → 最后一篇文档可选 refreshBuildingMemory
  → 返回合并后的 mergedGraph
```

## 6. 双模式数据层策略

与 `ProjectCostRecord` 相同：

| 条件 | BIM | DrawingAsset |
|------|-----|--------------|
| `USE_DATABASE=true` 且 DB 可达 | Prisma | Prisma |
| 否则 | `data/bim-models/*.json` | `data/drawing-assets/*.json` |

本地开发默认 mock 数据路径不变；启用 Docker Postgres 后设置 `USE_DATABASE=true` 即可切换。

## 7. 迁移步骤

### 7.1 Schema

```bash
npm run db:generate
npm run db:push    # 或 prisma migrate dev
```

### 7.2 导入已有 BIM JSON

```bash
USE_DATABASE=true npm run db:migrate-bim
# 等价于：USE_DATABASE=true npx tsx scripts/migrate-json-manifests-to-db.ts
```

脚本行为：

- 扫描 `data/bim-models/*.json`
- 若 DB 中无同 `id` 记录则 `create`
- 不删除 JSON 文件（作为回退备份）

### 7.3 历史图纸数据

已分析文档的知识图谱仍在 `extractedText` 中；首次访问知识图谱 API 时通过**解析回退**仍可工作。重新触发文档分析将写入 `DrawingAsset` 并规范化数据。

## 8. 后续迭代（不在本 PR）

| 优先级 | 项 | 说明 |
|--------|-----|------|
| ~~P1~~ | ~~真任务队列~~ | ✅ 已实现：`lib/jobs/` + BullMQ（`REDIS_URL`）或内部 API 回退 |
| P2 | `AIAnalysisCache` | `contentHash + analysisType` 唯一，带 `expiresAt` |
| P2 | 多页 PDF | 按页拆分 `DrawingAsset`，`pageNumber` 递增 |
| P3 | 微服务外置 | 仅 IFC 转换、OpenCV 等 CPU 密集任务 |

## 9. 验收标准

- [x] 代码：`BimModel` / `DrawingAsset` 双模式数据层与 ingest 落库
- [x] 代码：知识图谱 GET 读 `DrawingAsset` + 旧 `extractedText` 回退
- [x] 代码：知识图谱 POST 走 `runDocumentIngestWorkflow` 全量落库
- [x] 代码：新图纸分析 `extractedText` 不含 `--- Knowledge Graph ---` 块
- [ ] **待 DB**：`npm run db:push` 同步 schema
- [ ] **待 DB**：`USE_DATABASE=true` 下 BIM 上传与图纸分析写入 PostgreSQL
- [ ] **待 DB**：`npm run db:migrate-bim` 成功导入现有 BIM 清单
- [ ] **待 DB**：`USE_DATABASE=true npm run db:acceptance` 一键验收全部通过
- [ ] **待手动**：`USE_DATABASE=false` 下回归 BIM 上传、图纸分析、知识图谱 API

## 10. 实施记录

| 日期 | 项 | 说明 |
|------|-----|------|
| 2026-06-21 | Schema + 双模式层 | `BimModel`、`DrawingAsset`、文件回退 |
| 2026-06-21 | ingest / GET 图谱 | `document-ingest-workflow`、`knowledge-graph` GET |
| 2026-06-21 | POST 图谱落库 | POST 改为逐文档 `runDocumentIngestWorkflow` |
| 2026-06-21 | 工程卫生 | `.gitignore` drawing-assets、`seed` 清理新表、`db:migrate-bim` script |
| — | 待办 | Docker/Postgres 就绪后 `db:push` + 验收 |

## 11. 相关文件索引

| 文件 | 职责 |
|------|------|
| `lib/db/bim-models.ts` | BIM 双模式门面 |
| `lib/db/drawing-assets.ts` | 图纸分析双模式门面 |
| `lib/bim/bim-file-store.ts` | BIM JSON 回退 |
| `lib/ai/knowledge/drawing-asset-file-store.ts` | 图纸 JSON 回退 |
| `scripts/migrate-json-manifests-to-db.ts` | BIM JSON → PostgreSQL 一次性导入 |
| `types/drawing.ts` | `DrawingAssetRecord` 类型 |
| `prisma/schema.prisma` | 模型定义 |
| `types/bim.ts` | BIM TypeScript 类型（源-of-truth） |
| `lib/ai/vision/types.ts` | `DrawingAnalysisResult` |
| `lib/ai/knowledge/drawing-knowledge-graph.ts` | 图谱构建与合并 |
| `lib/ai/workflow/document-ingest-workflow.ts` | 分析落库触发点 |
| `app/api/projects/[projectId]/knowledge-graph/route.ts` | 图谱读取与批量分析 |
