# Payment & Order Ops — Backend

Internal ops API that backs the `frontend/` dashboard. This phase ships **one vertical
slice only: Service Health check definitions** (a CRUD store for probe/curl definitions —
it does **not** execute probes). Other modules (test-runs, orders, logs, auth) are not
implemented yet.

**Single deployment, three logical environments.** One host + one connection string hold
`dev` / `preprod` / `production` data; every Service Health request carries an
`X-Environment` header that scopes all reads and writes (see *Environment scoping* below).

- .NET 10 · C# · Minimal API + `TypedResults`
- EF Core 10 on **PostgreSQL** (Npgsql)
- OpenAPI (`Microsoft.AspNetCore.OpenApi`) + Scalar UI
- Serilog · RFC 9457 `ProblemDetails` + `IExceptionHandler`
- `Asp.Versioning` → `/api/v1`
- Central Package Management, `Directory.Build.props`, `.editorconfig`, warnings-as-errors

## Prerequisites

- .NET SDK 10.x
- Docker (local database + integration tests)

## Quick start

```bash
cd backend

# 1. local PostgreSQL 17 on localhost:5544
docker compose up -d

# 2. restore the dotnet-ef local tool (first time only)
dotnet tool restore

# 3. run the API (auto-applies migrations in Development)
dotnet run --project src/PaymentOrderOps.Api
```

Then:

| URL | What |
| --- | --- |
| `http://localhost:5080/scalar/v1` | API reference (Scalar) |
| `http://localhost:5080/openapi/v1.json` | OpenAPI document |
| `http://localhost:5080/api/v1/service-health/checks` | Service Health CRUD |
| `http://localhost:5080/health` | Readiness (checks DB) |
| `http://localhost:5080/alive` | Liveness |

`dotnet run` uses the `http` launch profile (`Properties/launchSettings.json`,
`ASPNETCORE_ENVIRONMENT=Development`, port 5080).

## Configuration

`appsettings.json` + `appsettings.Development.json`, overridable by environment variables
(`ConnectionStrings__Default`, `Cors__AllowedOrigins__0`, …) and user secrets.

| Key | Purpose | Default |
| --- | --- | --- |
| `ConnectionStrings:Default` | PostgreSQL connection string | dev: `localhost:5544` · prod: unset (must be supplied) |
| `Cors:AllowedOrigins` | allowed browser origins (bound via Options pattern to `CorsSettings`) | `["http://localhost:5173"]` |
| `Serilog:*` | sink / level configuration | Console, `Information` |

CORS also exposes the `X-Correlation-ID` response header so the SPA can log it.

## Database migrations

Migrations live in `src/PaymentOrderOps.Infrastructure/Persistence/Migrations` and are
applied automatically on startup **in the Development environment only**
(`InfrastructureModule.ApplyMigrationsAsync`).

Add a migration after a model change (never hand-write SQL):

```bash
dotnet ef migrations add <Name> \
  --project src/PaymentOrderOps.Infrastructure \
  --startup-project src/PaymentOrderOps.Api \
  --output-dir Persistence/Migrations
```

For non-Development environments, do **not** migrate on boot. Produce an artifact from CI
and apply it during deploy:

```bash
# idempotent SQL script (review + run against the target DB)
dotnet ef migrations script --idempotent \
  --project src/PaymentOrderOps.Infrastructure \
  --startup-project src/PaymentOrderOps.Api \
  --output artifacts/migrate.sql

# or a self-contained bundle
dotnet ef migrations bundle --self-contained -r linux-x64 \
  --project src/PaymentOrderOps.Infrastructure \
  --startup-project src/PaymentOrderOps.Api \
  --output artifacts/efbundle
# deploy step:
./artifacts/efbundle --connection "$ConnectionStrings__Default"
```

Design-time tooling resolves a context via `AppDbContextFactory` (reads
`ConnectionStrings__Default`, falls back to the local compose DB), so `dotnet ef` never
needs the app host or a live database.

## Tests

```bash
dotnet test
```

Integration tests (`tests/PaymentOrderOps.Api.Tests`) run the real API through
`WebApplicationFactory` against a throwaway **PostgreSQL container** (Testcontainers), so
**Docker must be running**. They cover list/seed, create + round-trip, duplicate → 409,
validation → 400, not-found → 404, full replace, soft-delete, missing/invalid
`X-Environment` → 400, cross-environment isolation (`404` + hidden from list), same
URL allowed in two environments, and body/header environment mismatch → 400.

## Project layout

```
backend/
  PaymentOrderOps.slnx
  Directory.Build.props / Directory.Packages.props / .editorconfig
  docker-compose.yml
  src/
    PaymentOrderOps.Domain          entity + enums (no dependencies)
    PaymentOrderOps.Infrastructure  AppDbContext, EF configuration, migrations, seed
    PaymentOrderOps.Api             host + feature slices (Features/ServiceHealth/*)
  tests/
    PaymentOrderOps.Api.Tests       WebApplicationFactory + Testcontainers
```

## API — Service Health

Base: `/api/v1/service-health/checks` · **`X-Environment: dev | preprod | production` is
required on every call** (missing/invalid → `400 ProblemDetails`).

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/` | `200` — definitions in the header's environment |
| `GET` | `/{id}` | `200` / `404` (another environment's id → `404`) |
| `POST` | `/` | `201` + `Location` + created resource · `400` · `409` |
| `PUT` | `/{id}` | `200` + updated resource · `404` · `400` · `409` |
| `DELETE` | `/{id}` | `204` (soft delete) · `404` |

Response JSON matches the frontend `HealthCheck` contract: `camelCase`, `group` as a
lowercase string (`payment|order|platform|custom`), `method` uppercase, `source` as
`builtin|custom`. Extra fields (`environment`, `isEnabled`, `updatedAt`, `rowVersion`) are
additive; `environment` is also lowercase (`dev|preprod|production`).

`rowVersion` is the row's optimistic-concurrency token; send it back on `PUT` to get a
`409` instead of a lost update. Duplicate protection is on the normalised
`(environment, method, lower(url) without trailing slash)` triple — a filtered unique index
plus a pre-check, both surfacing `409` with `ProblemDetails`. The same URL may therefore be
registered once per environment.

PATCH (partial update) is intentionally not implemented this phase.

### Environment scoping

- `X-Environment` is read by an endpoint filter on the group into a scoped
  `IEnvironmentContext` that handlers depend on (`EnvironmentContext.cs`).
- `GET /` filters `WHERE Environment == ctx` (plus the soft-delete query filter).
  `GET /{id}`, `PUT`, `DELETE` all match on `Id AND Environment == ctx`, so another
  environment's row is simply `404` — no cross-environment read or edit.
- `POST` stamps `Environment = ctx`; `Environment` is immutable afterwards.
- Request bodies do **not** need `environment` (the header is the source of truth). If
  present it must equal the header, otherwise `400`.
- CORS allows any request header, `X-Environment` included.

## Architecture decisions

- **PostgreSQL, not SQL Server.** Native `jsonb` maps the `Headers` dictionary to a real,
  queryable column with zero ceremony; `xmin` gives a free optimistic-concurrency token
  (no extra `rowversion` column or trigger); the container is tiny and licence-free for an
  internal tool, which also keeps the Testcontainers test loop fast. The provider is
  reached only through `ConnectionStrings:Default`, so swapping is a config + provider
  change, not a code change.
- **Vertical slice, few projects, no MediatR.** Each feature owns its endpoints,
  contracts, validation and mapping under `Features/<Feature>/`. Handlers are static
  functions that take `AppDbContext` directly — no repository layer, no request pipeline
  indirection. The only shared cross-cutting pieces are the exception handler, correlation
  middleware and `ProblemDetails` wiring.
- **Entities never leave the API.** Separate `record` request/response DTOs with explicit
  hand-written mapping (`ServiceHealthMapping`). No AutoMapper.
- **DTO shape is the frontend contract.** `System.Text.Json` web defaults + a camelCase
  `JsonStringEnumConverter`; `method` is carried as a string (frontend wants `GET`), the
  enum stays internal for canonical de-duplication.
- **EF owns the schema.** Migrations are generated, applied automatically only in
  Development, and produced as script/bundle for anything else. Model rules
  (soft-delete named query filter, filtered unique index, `jsonb`, string-backed enums,
  `HasData` seed of the built-in services × 3 environments = 18 rows) live in
  `ServiceHealthCheckConfiguration`.
- **`Environment` is a scoping discriminator, not a deployment axis.** One DB, one
  connection string; a `varchar` `Environment` column (`Dev|Preprod|Production`, NOT NULL,
  column default `Dev`) plus a request-scoped ambient context. The column default only
  backstops the `AddColumn` migration — application code always writes an explicit value.
- **Operational baseline from day one.** Serilog request logging + `X-Correlation-ID`
  propagation, RFC 9457 `ProblemDetails` for every error path, `/health` (readiness, DB
  probe) vs `/alive` (liveness) kept distinct from the *domain's* "service health", CORS
  origins from configuration, `Asp.Versioning` URL-segment versioning at `/api/v1`.

## Notes

- `NuGetAuditMode=direct`: a transitive `Microsoft.OpenApi` advisory has no
  ASP.NET-compatible patched version yet; auditing stays on for our direct dependencies.
- API Explorer version substitution (MVC package) is omitted; the OpenAPI document shows
  the `v{version}` route parameter literally. Cosmetic, revisit when a second version
  lands.
