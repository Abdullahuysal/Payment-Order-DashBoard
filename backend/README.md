# Payment & Order Ops — Backend

Internal ops API that backs the `frontend/` dashboard. Slices shipped so far:

- **Service Health check definitions** — a CRUD store for probe/curl definitions (does
  **not** execute probes).
- **Message Queues & DLQ** — read-only RabbitMQ + Kafka observability (queues, topics,
  consumer-group lag, dead-letter inspection, computed alerts) with a server-side domain
  scope (`nameMatches` globs + a persisted per-environment `/scope` profile). No remediation.
- **Test Runs** — seeded end-to-end scenarios, environment-scoped input profiles, and
  asynchronous runs executed by a background worker against config-driven **company targets**
  (HTTP APIs, SOAP services, a read-only SQL Server). Live progress over SSE; optional bulk
  repeat. Disabled in `production`.

Other modules (orders, logs, auth) are not implemented yet.

**Single deployment, three logical environments.** One host + one connection string hold
`dev` / `preprod` / `production` data; every request carries an `X-Environment` header that
scopes all reads and writes (see *Environment scoping* below). For Message Queues the same
header selects which broker connection block is used.

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

# 1. local infra: PostgreSQL 17 (localhost:5544), RabbitMQ + management
#    (localhost:5672 / 15672, ops / ops_local_pw), single-node Kafka (localhost:9092)
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
| `http://localhost:5080/api/v1/message-queues/brokers` | Message-queue broker status |
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
| `MessageBrokers:<Env>:RabbitMq` | management URL + creds + `VirtualHost` + `DeadLetterQueuePatterns` + `BacklogReadyThreshold` (default `100`) | unset → `503` from RabbitMQ endpoints in that env |
| `MessageBrokers:<Env>:Kafka` | `BootstrapServers`, `SecurityProtocol`, optional SASL, `DeadLetterTopicPatterns`, lag thresholds | unset → `503` from Kafka endpoints in that env |
| `CompanyApis:<Env>:<name>` | `BaseUrl` · `AuthRef` · `TimeoutSeconds` — a named company HTTP API for `httpRequest` / `poll` steps | no block for the env → `503` at run start |
| `SoapServices:<Env>:<name>` | `Endpoint` · `AuthRef` · `DefaultSoapAction` · `TimeoutSeconds` — a named SOAP service for `soapRequest` steps | no block for the env → `503` at run start |
| `CompanyDb:<Env>` | `ConnectionString` (a **SQL Server** string; use a `db_datareader`-only account) · `CommandTimeoutSeconds` — target for `dbQuery` steps | blank → `503` at run start |
| `Auth:<Env>:<authRef>` | `Kind` = `none` \| `static` \| `tokenEndpoint` \| `serviceHeader`, plus kind-specific keys (`Header`, `Value`, `Url`, `Method`, `BodyTemplate`, `TokenPath`, `ValuePath`, `Format`, `TtlSeconds`) | referenced but missing → `503` at run start |
| `TestRuns:AllowedEnvironments` | environments where runs are permitted | `[ dev, preprod ]` |
| `TestRuns:MaxBulkCount` / `TestRuns:MaxBulkConcurrency` | bulk `repeat` ceilings (`400` if exceeded) | `10` / `5` |
| `Serilog:*` | sink / level configuration | Console, `Information` |

CORS also exposes the `X-Correlation-ID` response header so the SPA can log it.

`CompanyApis` / `SoapServices` / `CompanyDb` / `Auth` are keyed by logical environment
(`Dev` / `Preprod` / `Production`); `production` never runs regardless. Secrets come from
environment variables / user-secrets today
(`Auth__Dev__<authRef>__Value`, `CompanyDb__Dev__ConnectionString`), Vault later at the **same
key paths**. `appsettings.json` ships every environment's blocks **empty** (so every run start
is `503` until filled); `appsettings.Development.json` leaves a blank skeleton for `Dev`.

`MessageBrokers` is keyed by logical environment (`Dev` / `Preprod` / `Production`). Secrets
come from environment variables / user-secrets today
(`MessageBrokers__Dev__RabbitMq__Password`, `MessageBrokers__Dev__Kafka__SaslPassword`);
Vault later reads the **same key paths**. A missing environment or broker block, or a blank
`ManagementUrl` / `BootstrapServers`, means "not configured" and the matching endpoints
answer `503`; a configured broker that cannot be reached answers `502`.

`appsettings.json` ships all three environments with **blank** connection fields (so every
broker endpoint is `503` until filled). `appsettings.Development.json` points `Dev` at the
`docker compose` RabbitMQ (`ops` / `ops_local_pw`) and Kafka (`localhost:9092`) so local
runs work out of the box; point it at the real brokers when you have them.

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
**Docker must be running**. Service Health: list/seed, create + round-trip, duplicate → 409,
validation → 400, not-found → 404, full replace, soft-delete, missing/invalid
`X-Environment` → 400, cross-environment isolation (`404` + hidden from list), same
URL allowed in two environments, body/header environment mismatch → 400.
Message Queues: `X-Environment` enforced, `brokers` lists both brokers as unconfigured,
list/topic/consumer-group endpoints → `503` when unconfigured, unknown broker/category → `400`,
`dead-letters` / `alerts` degrade to a partial result (incl. `scopedTotalDeadLettered`),
`GET`/`PUT /scope` round-trip + normalisation + per-environment isolation + validation → `400`.
Unit: `GlobPattern.Matches*` (strict + loose), `QueueCategories` classification, and
name-filter-before-paging on `ToPage`. Full-HTTP filtering against a live broker
(RabbitMQ / Kafka Testcontainer) is still not automated — verify against `docker compose`.
Test Runs — unit: `TemplateEngine`, `JsonPathEvaluator`, `AssertionEvaluator` (all six ops +
coercion), `SqlReadGuard`, `SecretMasker`, `StepSchemaValidator`, and `TokenBroker` (static /
`tokenEndpoint` TTL cache + refresh / `serviceHeader` every call / `none`). Integration
(fake company gateways in test DI): `X-Environment` / `production` → 400, `/scenarios` seed of
six + by-key + 404, profile CRUD + duplicate → 409 + per-environment isolation + stale
`rowVersion` → 409, `POST /` → 202 then worker runs it (steps persisted in order, `extract` →
`variables`), `poll` retries until ready (`attempts` counted) and times out → failed, a failed
assertion skips the rest and fails the run, a configured secret never appears in a persisted
step, unconfigured target family → 503, SSE emits `snapshot` → step events → `run-finished`,
`/cancel` (running → cancelled, terminal → 409, unknown → 404), bulk `count=3` → parent + 3
child iterations + summary, `count=11` → 400.

## Project layout

```
backend/
  PaymentOrderOps.slnx
  Directory.Build.props / Directory.Packages.props / .editorconfig
  docker-compose.yml
  src/
    PaymentOrderOps.Domain          entities + enums (no dependencies)
    PaymentOrderOps.Infrastructure  AppDbContext, EF config, migrations, seed
      Messaging/                     RabbitMQ management client + Kafka admin gateway + options
      TestRuns/                      company-target options + gateways (HTTP / SOAP / SQL Server) + token broker
    PaymentOrderOps.Api             host + feature slices
      Infrastructure/Endpoints/     IEndpointModule + discovery / API-version wiring
      Features/<Feature>/V<n>/
        <Operation>/                one folder per endpoint: endpoint + its request + validator
        Shared/                     response DTO, mapping, shared field rules, write invariants
        <Feature>V<n>Module.cs      groups the operation endpoints under one route + filter
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

## API — Message Queues & DLQ

Base: `/api/v1/message-queues` · **`X-Environment` required** · every endpoint is `GET`
except `PUT /scope` (a local preference, not a broker write). Not configured → `503`;
configured but unreachable → `502`; both as `ProblemDetails`.

| Route | Purpose |
| --- | --- |
| `/brokers` | brokers configured for the env + reachability (never `503`; reports `configured:false`) |
| `/brokers/{broker}/health` | deep health — `broker` = `rabbitmq` \| `kafka` (else `400`) |
| `/rabbitmq/queues` | queues: depth, consumers, rates, DLQ flags, computed `categories[]` · `?nameContains` `?nameMatches`✱ `?scoped` `?category`✱ `?onlyProblems` `?deadLetterOnly` `?page` `?pageSize` |
| `/rabbitmq/queues/{vhost}/{name}` | one queue + `categories[]`, arguments, `x-dead-letter-*`, bindings (`vhost` URL-encoded, `/` → `%2F`) · `404` |
| `/rabbitmq/queues/{vhost}/{name}/messages` | preview without consuming (`ack_requeue_true`); `x-death` reasons · `?count` (≤ 50) · `404` |
| `/kafka/topics` | topics: partitions, replication, under-replicated, DLT flag · `?nameContains` `?nameMatches`✱ `?scoped` `?includeInternal` `?deadLetterOnly` `?onlyProblems` `?page` `?pageSize` |
| `/kafka/topics/{name}` | per-partition low/high watermark, ISR, message counts · `404` |
| `/kafka/topics/{name}/messages` | tail of a topic/partition without committing · `?partition` `?fromOffset` `?count` (≤ 50) · `404` |
| `/kafka/consumer-groups` | groups: state, members, total lag · `?groupContains` `?nameMatches`✱ `?scoped` `?onlyLagging` `?minLag` |
| `/kafka/consumer-groups/{groupId}` | per-partition committed / high / lag + member assignments · `404` |
| `/dead-letters` | unified DLQ + DLT summary; `warnings[]` for an unconfigured/unreachable broker (still `200`) · `?nameMatches`✱ `?scoped` |
| `/alerts` | computed, severity-ranked problems · `?nameMatches`✱ `?scoped` (filters on `alert.resource`) |
| `GET /scope` | this environment's saved domain profile → `{ patterns: string[], updatedAt: string? }` (no row → `{ patterns: [], updatedAt: null }`) |
| `PUT /scope` | body `{ patterns: string[] }` → `200` + resource. Upsert, one row per environment, last-write-wins. `400` on null / > 100 patterns / a blank or > 256-char pattern |

✱ **`nameMatches`** is repeatable (`?nameMatches=a&nameMatches=b`). A value containing `*`
is an anchored glob (`*` = any run of characters, everything else literal); a value with no
`*` means "contains". Always case-insensitive. Multiple values are **OR**. It combines with
the other filters as **AND**, and is applied **before** `page`/`pageSize` — so
`PagedResponse.totalCount` is the filtered count.

**`?scoped=true`** loads the current environment's `PUT /scope` patterns and adds them to the
effective `nameMatches` set (union; still OR within the set). An empty or absent profile makes
`?scoped=true` a no-op. `/scope` is **per environment** because the whole app scopes state by
`X-Environment` (broker connection blocks, Service Health rows) and queue names / team
boundaries differ across `dev` / `preprod` / `production`; `PUT /scope` writes a local
preference row and never contacts a broker.

**`/dead-letters`**: `totalDeadLettered` is always the unfiltered grand total across both
brokers; `scopedTotalDeadLettered` is the sum after `nameMatches` / `scoped` (equal when no
filter). `/alerts` filtering is on `alert.resource`, so a broker- or cluster-level alert whose
resource is not a queue name is hidden when `nameMatches` is set.

**`?category`** (RabbitMQ queues only) is repeatable, OR-combined, values `error` | `skip` |
`backlog` (unknown → `400`). Every queue also carries a computed `categories[]`:
- `error` — `isDeadLetter` (glob match on `DeadLetterQueuePatterns`) **or** name contains one of
  `error, errors, dlq, dead-letter, failed, failure, poison`.
- `skip` — name contains one of `skip, skipped, parked, quarantine, hold`.
- `backlog` — `messagesReady > 0` **and** (`consumers == 0` **or** `messagesReady >=`
  `MessageBrokers:<Env>:RabbitMq:BacklogReadyThreshold`, default `100`).

Dead-letter classification is glob-based (`DeadLetterQueuePatterns` / `DeadLetterTopicPatterns`);
`x-dead-letter-exchange` on a queue is surfaced separately as `hasDeadLetterConfigured`.
`/rabbitmq/queues` and `/kafka/topics` are paged (`PagedResponse<T>`); Kafka list omits
message counts (`approxMessageCount: -1`) — use the topic detail endpoint. Replay / purge /
message delete are intentionally **not** implemented this phase.

## API — Test Runs

Base: `/api/v1/test-runs` · **`X-Environment: dev | preprod` required** on every call except
the SSE stream. `production` (or any environment outside `TestRuns:AllowedEnvironments`) →
`400 ProblemDetails` ("Test koşumları production ortamında devre dışıdır."). A scenario step
that references a company-target **family** with no configuration in that environment →
`503` at start; a configured target that cannot be reached → the run **fails** (its failing
step carries the reason). `502` is reserved for the same unreachable case surfaced
synchronously.

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/scenarios` | `200` — the six seeded scenarios (global, not environment-scoped) |
| `GET` | `/scenarios/{idOrKey}` | `200` `ScenarioDetail` (steps + `bulk` limits for repeat-capable scenarios) · `404`. Accepts an id **or** a key |
| `GET` | `/scenarios/{idOrKey}/profiles` | `200` — this environment's saved profiles |
| `POST` | `/scenarios/{idOrKey}/profiles` | `{ name, values }` → `201` + `Location` · `400` · `404` · `409` (duplicate name) |
| `PUT` | `/scenarios/{idOrKey}/profiles/{pid}` | `{ name, values, rowVersion? }` → `200` · `400` · `404` · `409`. `rowVersion` is optional — omit it for last-write-wins, send it back for a `409` on a stale write |
| `DELETE` | `/scenarios/{idOrKey}/profiles/{pid}` | `204` · `404` |
| `POST` | `/` | `{ scenarioId, profileId?, runParams, repeat?: { count, concurrency } }` → `202` + `Location(/api/v1/test-runs/{runId})` + `{ runId }` · `400` · `404` · `503`. Execution happens on the worker, never in the request |
| `GET` | `/` | `?scenarioId` `?status` `?from` `?to` (ISO dates, `to` inclusive) → `200` `RunSummary[]` (bulk children excluded) |
| `GET` | `/{runId}` | `200` `Run` (steps, variables, and for a bulk run `iterations` + `summary`) · `404` |
| `GET` | `/{runId}/events?env=dev\|preprod` | `text/event-stream`. First a `snapshot` (the full `Run`), then `step-started` / `step-finished`, then `run-finished`, then the stream closes. `env` is a query parameter because a browser `EventSource` cannot send headers; the `X-Environment` header is honoured as a fallback |
| `POST` | `/{runId}/cancel` | `202` (running or queued) · `409` (already terminal) · `404` |

Response JSON matches the frontend `test-runs` contract (`camelCase`, lowercase enum strings).
The bulk `summary` is `{ total, passed, failed, durationMs: { min, median, max }, orderNos }`.
`triggeredBy` is the `X-User` request header, or `"anonymous"`.

### Step schema (the `Steps` jsonb — a closed set)

Common: `{ key, title, kind, extract?: { <var>: "<path>" }, expect?: Assertion }`. Kinds:
`httpRequest` · `soapRequest` · `poll` (repeats a `read` until an `until` assertion or
`timeoutMs`) · `dbQuery` (a single read-only T-SQL statement; `{{var}}` placeholders become
`@p0`, `@p1`, … bound parameters) · `extract` (pull `map` values out of an earlier step's
output) · `assert` · `delay`. `Assertion` = `{ path?|jsonPath?|xpath?|column?, op:
equals|notEquals|contains|exists|gt|lt, value? }`. JSONPath support is a minimal in-box
evaluator (`$.a.b[0].c` — no wildcards/filters); XML uses `System.Xml.XPath`. String fields
are templated with `{{var}}` / `{{a.b}}`; a missing variable fails the step. Hosts are **never**
templated — steps carry `companyApi:<name>` / `soap:<name>` references and the host comes from
config only.

### Auth (config-driven, per environment)

Each company target may name an `authRef`; `ITokenBroker` resolves it before the step is sent:
`none` (no header) · `static` (a fixed secret in a header) · `tokenEndpoint` (one call, token
pulled from `TokenPath`, cached for `TtlSeconds`, formatted via `Format` with `{token}`) ·
`serviceHeader` (a call on **every** request, value from `ValuePath`). `SecretMasker` redacts
known sensitive headers (`Authorization`, `apikey`, `X-Auth-Token`, …), any configured `static`
secret, and every token the broker resolves for that run — applied **before** a step's request
/ response is persisted or logged.

### Notes / assumptions

- **Seed steps are placeholders.** The six scenarios are seeded with the exact keys / titles /
  kinds the frontend renders, but their internals point at not-yet-configured targets
  (`TestRunSeedSteps.Placeholder.cs`). QA replaces that one file when the real step tables land;
  nothing else in the slice depends on its body.
- **The SSE event bus is single-instance** (`InMemoryTestRunEventBus`, one in-memory replay
  buffer per run). Behind more than one host, a client would only see events from the host it
  connected to. `TestRunWorker` processes runs one at a time; a bulk run fans out internally
  (`Parallel.ForEachAsync`, bounded by `repeat.concurrency`).
- **The company DB is SQL Server** (`Microsoft.Data.SqlClient`), independent of the dashboard's
  PostgreSQL. `dbQuery` runs read-only T-SQL only (`SqlReadGuard`: single statement, `SELECT`/
  `WITH` only, no DML/DDL keywords) — give it a connection string for a `db_datareader`-only
  account. This is a pragmatic allow-list, not a full parser; step-schema validation is the
  first line of defence.

## Architecture decisions

- **PostgreSQL, not SQL Server.** Native `jsonb` maps the `Headers` dictionary to a real,
  queryable column with zero ceremony; `xmin` gives a free optimistic-concurrency token
  (no extra `rowversion` column or trigger); the container is tiny and licence-free for an
  internal tool, which also keeps the Testcontainers test loop fast. The provider is
  reached only through `ConnectionStrings:Default`, so swapping is a config + provider
  change, not a code change. The one `Microsoft.Data.SqlClient` dependency is unrelated: it
  is the **company** database that Test Runs' `dbQuery` reads (external, SQL Server), never
  the dashboard's own store.
- **Vertical slice, few projects, no MediatR.** Each feature version owns its endpoints,
  contracts, validation and mapping under `Features/<Feature>/V<n>/`. Every operation is a
  folder (`CreateCheck/`, `ReplaceCheck/`, …) holding just that endpoint, its request record
  and its validator; a `…Module` groups them. Handlers are static functions that take
  `AppDbContext` directly — no repository layer, no request pipeline indirection. Anything
  used by more than one operation (the response DTO, `ToResponse` mapping, shared field
  rules, the create/replace write invariants in `ServiceHealthWriteRules`) lives in
  `V<n>/Shared/` — a helper, not a service class. The only shared cross-cutting pieces are
  the exception handler, correlation middleware and `ProblemDetails` wiring.
- **Endpoints self-register.** A slice's `…Module` implements `IEndpointModule`;
  `app.MapFeatureModules()` discovers every implementation in the API assembly at startup,
  so a new feature or API version never edits `Program.cs`. Supported API versions are
  declared once in `EndpointModuleExtensions.SupportedVersions`; the `Created` location is
  derived from the request path, so it is not pinned to `v1`.
- **Entities never leave the API.** Separate `record` request/response DTOs with explicit
  hand-written mapping (`ServiceHealthMapping`). No AutoMapper.
- **Broker access is stateless gateways, no ambient client.** `IRabbitMqManagementClient`
  talks to the RabbitMQ **management HTTP API** with a single pooled `HttpClient` (no
  `RabbitMQ.Client` dependency — AMQP can't report queue depth/rates); `IKafkaAdminGateway`
  wraps `Confluent.Kafka` `IAdminClient` + a short-lived consumer for watermarks and tail
  reads. Both take the connection `*Options` **per call**; the API-side scoped
  `MessageBrokerResolver` picks the block for `X-Environment` and throws
  `MessageBrokerNotConfiguredException` (→ 503) / gateways throw
  `MessageBrokerUnreachableException` (→ 502), both mapped in `GlobalExceptionHandler`.
  Aggregate endpoints (`/dead-letters`, `/alerts`) catch the unreachable case and return a
  partial result instead of failing.
- **Domain scope filters in-process, after fetch, before paging.** The target is one shared
  broker per environment; the list endpoints pull the full set from the broker, then apply
  `nameMatches` (a scoped `QueueScopeResolver` unions the request's globs with the persisted
  `/scope` profile) and `category` in memory. `QueueScopeProfile` is one `jsonb` `string[]`
  row per environment (`Environment` is the PK), audited via `StampAudit` like the rest.
  It is view state, not a broker mutation, so it lives beside the read-only endpoints.
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
