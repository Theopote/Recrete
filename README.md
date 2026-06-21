# Recrete · 砼憶

**AI Copilot for Existing Building Renovation**  
面向既有建筑更新的 AI 设计助手

Recrete / 砼憶 is an AI building renovation agent that **reads, understands, diagnoses, imagines, and manages** adaptive reuse and urban renewal projects — not a generic project management tool.

> Reimagine. Renew. Recreate. · 重构想象，焕新再造

---

## MVP Highlights

Three experiences designed to make the product feel unmistakably **AI-native** from the first interaction:

### 1. AI Create Project · AI 创建项目

Describe a building in **one sentence** — no long forms. AI streams the creation process and automatically generates:

- Project name and building profile
- Renovation goals and risk assessment
- Missing documentation list
- Recommended next-step tasks
- Initialized **Building Memory**

**Try it:** Dashboard → **Create with AI**, or visit `/projects/new`.

Example brief:

```text
我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，
现在想改成社区文化中心，预算有限，希望保留主体结构。
```

### 2. Building Memory · 建筑记忆

Each project has a persistent **Building Memory** page — Recrete's core brand asset:

| Section | Description |
|---------|-------------|
| **Known Facts** · AI 已知 | What the agent already understands |
| **Missing Information** · AI 未知 | Critical documentation gaps |
| **Key Risks** · 关键风险 | Compliance, structure, and program risks |
| **Renovation Potential** · 改造潜力 | AI assessment of reuse opportunity |
| **Next Tasks** · 下一步 | Recommended actions before design |

### 3. Strategy Lab · AI 策略实验室

Click **Generate Strategies** to produce three professional options with automatic comparison:

- **Light Intervention** · 轻介入更新
- **Medium Reconfiguration** · 中度功能重组
- **Deep Recreation** · 深度再造

Compared across cost, schedule, risk, design value, feasibility, construction difficulty, and preservation level.

---

## Features

- **AI Command Center** — portfolio overview, insights, and one-sentence project creation
- **Project workspace** — overview, building profile, documents, timeline
- **Survey Intelligence** — site survey analysis
- **AI Diagnosis** — building condition assessment with severity tracking
- **Strategy Lab** — AI strategy generation and side-by-side comparison
- **Cost & Risk** — project-level risk and cost signals
- **Issues** — site issue tracker
- **Reports** — Markdown report editor and export
- **Knowledge Base** — renovation reference articles
- **AI Assistant** — project-aware copilot sidebar
- **Streaming AI create** — SSE-based step-by-step creation UI

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + Radix UI primitives |
| Data | [Prisma](https://www.prisma.io/) + PostgreSQL (optional) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query](https://tanstack.com/query) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) (credentials) |
| AI | Mock service by default; OpenAI-ready abstraction |

Without PostgreSQL, the app runs on an **in-memory mock store** with rich demo data — ideal for evaluation and demos.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)

### Quick start (mock mode)

```bash
# Clone the repository
git clone <your-repo-url>
cd Recrete

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page.

**Demo credentials**

| Email | Role |
|-------|------|
| `lin.wei@recrete.io` | Architect |
| `chen.hao@recrete.io` | Engineer |
| `zhang.mei@recrete.io` | Project Manager |

Password for all demo accounts: `recrete2026`

### Recommended demo flow (~2 min)

1. **Dashboard** → paste the Xi'an example brief → **Create with AI**
2. Watch the **streaming creation** panel (profile → risks → memory → tasks)
3. Land on **Building Memory** for the new project
4. Open **Strategy Lab** → **Generate Strategies** → review the 3-way comparison

The seeded demo project `proj-demo` (**Old Concrete Office Renewal**, Xi'an) includes full Building Memory, diagnosis, and strategies.

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recrete?schema=public"
USE_DATABASE="false"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="recrete-dev-secret-change-in-production"
OPENAI_API_KEY=""
AI_SERVICE="mock"
```

| Variable | Description |
|----------|-------------|
| `USE_DATABASE` | Set to `"true"` to persist data in PostgreSQL |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL for NextAuth |
| `NEXTAUTH_SECRET` | Session encryption secret (change in production) |
| `AI_SERVICE` | `mock` (default) or `openai` |
| `OPENAI_API_KEY` | Required when `AI_SERVICE=openai` |

---

## PostgreSQL Persistence

```bash
# Start PostgreSQL via Docker
npm run db:up

# Enable database mode in .env
USE_DATABASE="true"

# Push schema and seed
npm run db:push
npm run db:seed
```

The repository layer (`lib/db/repository.ts`) automatically selects:

- **Prisma / PostgreSQL** when `USE_DATABASE=true` and the database is reachable
- **In-memory mock store** otherwise

---

## AI Service

By default, Recrete uses a **mock AI service** with realistic delays and structured outputs — no API key required.

To use OpenAI with **scenario-based model routing**:

```env
AI_SERVICE=openai
OPENAI_API_KEY=sk-...
LANGCHAIN_ENABLED=true

# Optional per-scenario models
OPENAI_MODEL_REASONING=gpt-4o      # diagnosis, strategy, reports
OPENAI_MODEL_VISION=gpt-4o         # drawings & photos
OPENAI_MODEL_FAST=gpt-4o-mini      # summaries
OPENAI_MODEL_COPILOT=gpt-4o-mini   # sidebar assistant
```

| Scenario | Default model | Capability |
|----------|---------------|------------|
| Vision | `gpt-4o` | Drawing / photo / scan analysis |
| Reasoning | `gpt-4o` | Diagnosis, strategy, reports |
| Fast | `gpt-4o-mini` | Document summaries |
| Compliance | rule engine + RAG + LLM hybrid | GB code checks |
| Copilot | `gpt-4o-mini` | Project assistant chat |

Anthropic Vision: set `VISION_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

**Async document analysis:** uploads return `analysisTaskId`; poll `GET /api/projects/{id}/analysis-tasks/{taskId}` for progress.

The AI layer lives in `lib/ai/` (`model-router.ts`, providers, agents, LangChain chains).

### Streaming project creation

`POST /api/projects/ai-create/stream` returns Server-Sent Events as the agent progresses through creation phases. The UI in `components/projects/AICreateStreamPanel.tsx` consumes this stream.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:up` | Start PostgreSQL (Docker Compose) |

---

## Project Structure

```
app/                    Pages, layouts, and API routes
  api/projects/         Project CRUD, AI create (incl. SSE stream), strategies
  dashboard/            AI Command Center
  projects/             Project list, detail, AI create page
components/
  ai/                   Building Memory, copilot, streaming create UI
  projects/             Project workspace sections
  strategies/           Strategy cards and comparison table
lib/
  ai/                   AI agents, mock/OpenAI providers, prompts
  db/                   Repository (mock + Prisma), mappers
  mock-data/            Demo seed data
  stores/               Zustand client state
prisma/                 Schema and seed script
types/                  Shared TypeScript types
```

---

## Authentication

- NextAuth.js with JWT sessions and a credentials provider
- All routes except `/login` are protected by middleware
- With PostgreSQL enabled, users are validated against `User.passwordHash`

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contributing

Contributions are welcome. Please open an issue or pull request with a clear description of the change.

When contributing, run `npm run lint` and `npm run build` before submitting.
