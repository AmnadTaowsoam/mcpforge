# MCPForge

MCP server generation product foundation with enterprise-grade frontend expectations and production-shaped backend documentation.

## What This Repo Should Become

MCPForge is designed to be cloned, started, and extended into a real product. The documentation now defines the complete target implementation: premium UI, backend modules, data model, API, jobs, environment, testing, and release gates.

## Clone-And-Run Target

~~~bash
git clone https://github.com/AmnadTaowsoam/mcpforge.git
cd mcpforge
cp .env.example .env
pnpm install
pnpm dev
~~~

Primary command:

~~~bash
pnpm create mcpforge shopee-connector
~~~

## Documentation

- [Project brief](docs/brief.md)
- [Requirements](docs/requirements.md)
- [Enterprise frontend spec](docs/frontend-enterprise.md)
- [Backend implementation spec](docs/backend-implementation.md)
- [Clone-and-run quickstart](docs/quickstart.md)
- [Environment and configuration](docs/environment.md)
- [Testing and quality plan](docs/testing-and-quality.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Delivery checklist](docs/delivery-checklist.md)

## Implementation Standard

- Frontend: enterprise, premium, luxury-grade UX where applicable.
- Backend: full workflow, API, jobs, persistence, audit, security, exports.
- Local dev: mock mode must work without paid external services.
- Release: tests, visual QA, security checks, and clone-and-run proof.

## License

MIT
