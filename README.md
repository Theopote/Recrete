# Recrete · 砼憶

**Reimagine. Renew. Recreate.**  
重构想象，焕新再造

AI-assisted platform for existing building renovation, adaptive reuse, and urban renewal projects.

## Features (MVP v0.1)

- Project dashboard with metrics and AI insights
- Project creation and management with filters
- Building profile / asset card
- Document upload and organization
- AI-assisted building diagnosis
- AI-assisted renovation strategy generation
- Multi-strategy comparison
- Site issue tracker (Kanban-style)
- Markdown report generator
- AI project assistant sidebar

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS** + shadcn/ui-style components
- **Prisma** + PostgreSQL
- **Zustand** / **TanStack Query**
- **React Hook Form** + **Zod**
- Mock AI service (OpenAI-ready abstraction)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run db:generate

# (Optional) Push schema to PostgreSQL and seed
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The MVP runs with **in-memory mock data** by default — no database required for development. Connect PostgreSQL when ready for production persistence.

## Demo Project

**Old Concrete Office Renewal** — Xi'an, China  
A 1986 reinforced concrete frame office being renovated into a community cultural center.

## AI Service

Set `AI_SERVICE=openai` and `OPENAI_API_KEY` in `.env` to use the real OpenAI API. Default is mock responses.

## Project Structure

```
app/           → Pages and API routes
components/    → UI and feature components
lib/           → AI service, database, mock data, utilities
prisma/        → Database schema and seed
types/         → TypeScript type definitions
```

## License

Private — Recrete Studio
