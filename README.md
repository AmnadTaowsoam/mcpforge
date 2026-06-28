# MCPForge

Production-grade MCP server generator — TypeScript/Python connectors, enterprise UI, full pipeline, 147 tests.

## Quick Start

```bash
git clone https://github.com/AmnadTaowsoam/mcpforge.git
cd mcpforge
cp .env.example .env          # fill JWT_SECRET, ENCRYPTION_KEY; leave AI_PROVIDER=mock for local dev
pnpm install
pnpm dev                       # api :4300 · web :4301 · worker
```

Build and generate your first connector:

```bash
pnpm build                                                            # compile CLI first
pnpm mcpforge generate --connector stripe --type REST --lang typescript
```

## Monorepo Layout

```
apps/
  api/        Fastify 5 — REST API, JWT auth, RFC 7807 errors
  web/        Next.js 15 App Router — full enterprise UI
  worker/     BullMQ 5 — 7-step generation pipeline
  cli/        @mcpforge/cli — generate / validate / pack / examples
packages/
  domain/     Generator engine, templates, manifest validator, release packager
  config/     Env schema (zod), mock/prod guards
  ui/         Shared design-system tokens
  testkit/    Test fixtures, mock factories, Zod contract helpers
```

## Stack

| Layer | Tech |
|---|---|
| Language | TypeScript 5.6+ strict, `NodeNext` modules |
| API | Fastify 5, Drizzle ORM, PostgreSQL 16 |
| Queue | BullMQ 5 + Redis 7 |
| Frontend | Next.js 15 App Router, React 19, zustand v5, @tanstack/react-query v5 |
| Auth | JWT HS256, RFC 7807 problem+json errors |
| Tests | Vitest 2.x (unit + integration) + Playwright (visual regression) |
| CI | GitHub Actions — typecheck · lint · test · build · security scan |
| Containers | Docker Compose (postgres + redis + api + worker + web) |

## CLI Reference

> Run `pnpm build` once before using `pnpm mcpforge` — the CLI bin resolves from `apps/cli/dist/`.

```bash
pnpm mcpforge generate --connector <name> --type REST|GraphQL|gRPC --lang typescript|python
pnpm mcpforge validate --manifest path/to/mcp.json
pnpm mcpforge list-templates
pnpm mcpforge pack --connector <name> --out ./dist
pnpm mcpforge examples
```

## API Routes

```
POST   /api/v1/auth/token                                      # issue JWT (mock mode: any email)
POST   /api/v1/auth/refresh                                    # refresh JWT
GET    /api/v1/workspaces/:wsId/projects/:pId/runs             # list runs
POST   /api/v1/workspaces/:wsId/projects/:pId/runs             # create run
POST   /api/v1/workspaces/:wsId/projects/:pId/runs/:id/start   # enqueue job
POST   /api/v1/workspaces/:wsId/projects/:pId/runs/:id/cancel  # cancel
POST   /api/v1/workspaces/:wsId/projects/:pId/runs/:id/review  # submit review
GET    /api/v1/workspaces/:wsId/findings                       # list findings (filterable)
PATCH  /api/v1/workspaces/:wsId/.../findings/:id               # update finding status
GET    /api/v1/workspaces/:wsId/artifacts                      # list artifacts
GET    /api/v1/workspaces/:wsId/.../artifacts/:id              # get single artifact
GET    /health                                                  # liveness
GET    /ready                                                   # readiness (checks DB)
```

## Worker Pipeline

Seven sequential steps — each returns `{ ok, updates }` or throws `WorkerError`:

1. **validate-inputs** — schema + runId guard
2. **prepare-context** — resolve workspace/project from job data
3. **execute-core-workflow** — GeneratorEngine → server, readme, tests, Dockerfile, manifest
4. **validate-output** — server non-empty + manifest valid JSON
5. **generate-findings** — credential scan + TODO detection
6. **package-artifacts** — sha256 checksums, connectorName-slugified paths
7. **notify-reviewers** — audit log + critical-finding flag

## Web UI Screens

| Path | Screen |
|---|---|
| `/login` | Email + password form, JWT stored in localStorage via zustand persist |
| `/dashboard` | StatCards (total/running/completed/failed) + run list |
| `/runs/new` | 3-step wizard: connector info → config → confirm |
| `/runs/[runId]` | Live polling workbench — artifacts + findings + review link |
| `/runs/[runId]/review` | Decision picker (approved/needs_revision/rejected) + history |
| `/settings` | Workspace info + user profile + members |
| `/gallery` | Searchable template library with CLI command snippets |

## Tests

```bash
pnpm -r test          # 147 tests across all packages
pnpm typecheck        # TypeScript strict check
pnpm lint             # ESLint
```

| Package | Tests | Coverage |
|---|---|---|
| `@mcpforge/domain` | 46 | generator, templates, manifest, golden snapshots |
| `@mcpforge/config` | 10 | env validation, mock/prod guards |
| `@mcpforge/testkit` | 14 | fixtures, contract helpers |
| `apps/api` | 34 | health, auth, runs, findings, artifacts, security (workspace isolation) |
| `apps/worker` | 43 | all 7 pipeline steps + runner |

Visual regression (Playwright) scaffolded in `apps/web/tests/visual/` — capture baseline with:

```bash
pnpm --filter @mcpforge/web test:visual --update-snapshots
```

## Local Development

```bash
pnpm dev              # starts all apps concurrently
pnpm build            # build all packages
pnpm typecheck        # type-check all packages
```

### Pre-commit hooks (secret scanning)

```bash
# Install gitleaks — https://github.com/gitleaks/gitleaks#installing
brew install gitleaks          # macOS
choco install gitleaks         # Windows

# Install lefthook hooks
pnpm add -g lefthook
lefthook install

# Manual scan of the full git history
gitleaks detect --config .gitleaks.toml
```

Hooks block commits that contain real secrets and block `git push` if the history scan fails.
`CI` runs `gitleaks-action` on every push — the `secret-scan` job must pass for `all-checks` to succeed.

### Environment

Copy `.env.example` to `.env`. Minimum required:

```
JWT_SECRET=<32+ chars>
ENCRYPTION_KEY=<32+ chars>
DATABASE_URL=postgres://...
REDIS_URL=redis://...
AI_PROVIDER=mock          # no paid API needed in dev
```

Full reference in [docs/environment.md](docs/environment.md).

## Docker

```bash
docker compose up -d      # postgres + redis + api + worker + web
docker compose down -v    # teardown with volumes
```

## Documentation

- [Architecture](docs/architecture.md)
- [Backend implementation spec](docs/backend-implementation.md)
- [Frontend enterprise spec](docs/frontend-enterprise.md)
- [Environment and configuration](docs/environment.md)
- [Testing and quality plan](docs/testing-and-quality.md)
- [Delivery checklist](docs/delivery-checklist.md)
- [Roadmap](docs/roadmap.md)

## License

MIT
