# Taskflow

A DevOps learning project — a pnpm monorepo with three NestJS microservices running on Kubernetes (minikube), with a full production-grade observability stack.

## Architecture

```mermaid
graph TB
  subgraph internet["External"]
      user["👤 User"]
  end

  subgraph taskflow["taskflow-dev namespace"]
      ingress["NGINX Ingress\ntaskflow.local"]
      gw["api-gateway\n:4000"]
      us["user-service\n:4002"]
      ts["task-service\n:4001"]
      pg["PostgreSQL\n:5432"]
      redis["Redis\n:6379"]
  end

  subgraph monitoring["monitoring namespace"]
      grafana["Grafana\ngrafana.taskflow.local"]
      prom["Prometheus\n:9090"]
      loki["Loki\n:3100"]
      tempo["Tempo\n:3200"]
      am["Alertmanager\n:9093"]
      slack["Slack\n#alerts-critical"]
      exporters["kube-state-metrics\nnode-exporter\npostgres-exporter\nredis-exporter"]
  end

  user -->|HTTP| ingress
  ingress --> gw
  gw -->|HTTP| us
  gw -->|HTTP| ts
  us --> pg
  ts --> pg
  gw --> redis

  us -->|OTLP| tempo
  ts -->|OTLP| tempo
  gw -->|OTLP| tempo

  prom -->|scrape /metrics| gw
  prom -->|scrape /metrics| us
  prom -->|scrape /metrics| ts
  prom --> exporters
  exporters -->|scrape| pg
  exporters -->|scrape| redis

  loki <-->|push logs| grafana
  prom --> grafana
  tempo --> grafana
  prom --> am
  am -->|notify| slack
```

## Stack

**Application**

- 3 NestJS microservices in a pnpm monorepo
- API Gateway pattern — single ingress point proxying to downstream services
- PostgreSQL (via Prisma) for persistence
- Redis for response caching and rate limiting

**Infrastructure**

- Kubernetes on minikube with Kustomize overlays
- NGINX Ingress Controller
- GitHub Actions CI with SonarCloud, Dependabot, Commitlint, Husky

**Observability**

- Prometheus — metrics scraping with RED dashboard
- Loki + Promtail — structured JSON log aggregation
- Tempo — distributed tracing via OTLP
- Grafana — unified dashboards (RED, Infrastructure, PostgreSQL, Redis)
- Alertmanager — alert routing to Slack

## Prerequisites

- [minikube](https://minikube.sigs.k8s.io/docs/start/) v1.32+
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [pnpm](https://pnpm.io/installation) v10+
- [kustomize](https://kubectl.docs.kubernetes.io/installation/kustomize/)
- Node.js v20+
- Docker Desktop (for building images into minikube)

## Quick Start

### 1. Start minikube

```bash
make start
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit with your Slack webhook URL
```

### 3. Deploy everything

```bash
make deploy-all
```

### 4. Start the tunnel (required for ingress)

```bash
make tunnel
```

### 5. Add hosts entries

```bash
echo "$(minikube ip) taskflow.local grafana.taskflow.local" | sudo tee -a /etc/hosts
```

The app is now available at:

- API: `http://taskflow.local`
- Grafana: `http://grafana.taskflow.local` (admin / taskflow123)

## Makefile Commands

| Command                          | Description                                     |
| -------------------------------- | ----------------------------------------------- |
| `make start`                     | Start minikube with sufficient resources        |
| `make stop`                      | Stop minikube (preserves cluster state)         |
| `make setup`                     | Create namespaces — run once on a fresh cluster |
| `make deploy`                    | Build and deploy all application services       |
| `make deploy-monitoring`         | Deploy the full monitoring stack                |
| `make deploy-all`                | Fresh deployment of everything                  |
| `make restart-services`          | Restart all application services                |
| `make tunnel`                    | Start minikube tunnel for ingress               |
| `make status`                    | Show pod status across all namespaces           |
| `make grafana`                   | Port-forward Grafana to localhost:3001          |
| `make prometheus`                | Port-forward Prometheus to localhost:9090       |
| `make logs-gateway`              | Stream api-gateway logs                         |
| `make logs-task`                 | Stream task-service logs                        |
| `make logs-user`                 | Stream user-service logs                        |
| `make create-monitoring-secrets` | Apply secrets from .env file                    |
| `make clean`                     | Remove all project resources from cluster       |
| `make prune`                     | Free up Docker disk space                       |

## Project Structure

```
taskflow/
├── apps/
│   ├── api-gateway/        # NestJS gateway — port 4000
│   ├── task-service/       # NestJS task service — port 4001
│   └── user-service/       # NestJS user service — port 4002
├── packages/
│   ├── database/           # Shared Prisma client
│   └── shared/             # Shared types and utilities
├── k8s/
│   ├── base/               # Base Kubernetes manifests
│   │   ├── api-gateway.yml
│   │   ├── task-service.yml
│   │   ├── user-service.yml
│   │   ├── ingress.yml
│   │   ├── postgres/
│   │   └── redis/
│   ├── overlays/
│   │   └── dev/            # Dev environment overrides (image tags)
│   └── monitoring/
│       ├── grafana/        # Grafana + dashboards
│       ├── prometheus/     # Prometheus + alert rules
│       ├── loki/           # Loki + Promtail
│       ├── tempo/          # Tempo
│       ├── alertmanager/   # Alertmanager + Slack routing
│       └── exporters/      # kube-state-metrics, node-exporter, postgres/redis exporters
├── scripts/
│   └── deploy.sh           # Build and tag images
├── Makefile
└── pnpm-workspace.yaml
```

## API Endpoints

All routes are exposed through the api-gateway at `http://taskflow.local`.

| Method | Path                    | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/users`                | List all users                         |
| GET    | `/users/:id`            | Get user by ID                         |
| GET    | `/users/:id/with-tasks` | Get user with their tasks (aggregated) |
| GET    | `/tasks`                | List all tasks                         |
| GET    | `/tasks/:id`            | Get task by ID                         |
| GET    | `/health`               | Health check                           |
| GET    | `/metrics`              | Prometheus metrics                     |

## Observability

### Grafana Dashboards

Open `http://grafana.taskflow.local` (admin / taskflow123):

- **Taskflow RED Dashboard** — request rate, error rate, P99 latency per service
- **Infrastructure Overview** — pod status, CPU/memory usage, node pressure, PV usage
- **PostgreSQL Overview** — connections, cache hit ratio, transactions, database sizes
- **Redis Overview** — hit rate, memory usage, commands/s, evictions

### Logs

Structured JSON logs with OTel trace context injection across all three services. Query in Grafana Explore with Loki:

```logql
{namespace="taskflow-dev", app="api-gateway"}
| json
| line_format "{{.log}}"
| json
| traceId != ""
```

Click **View Trace in Tempo** from any log line to jump directly to the corresponding trace.

### Traces

OTLP traces exported via HTTP/protobuf to Tempo. All three services are auto-instrumented via `@opentelemetry/auto-instrumentations-node`.

### Alerts

Alertmanager routes to Slack `#alerts-critical`. Active alert rules:

**Infrastructure:** PodCrashLooping, PodOOMKilled, NodeMemoryPressure, PersistentVolumeAlmostFull

**Application:** ServiceDown, HighErrorRate (>5%), HighLatency (P99 >1s)

**PostgreSQL:** PostgreSQLDown, HighConnections, Deadlocks, LowCacheHitRatio

**Redis:** RedisDown, HighMemory, LowHitRate

## Database

PostgreSQL runs as a StatefulSet with two databases:

- `userdb` — users table (managed by user-service via Prisma)
- `taskdb` — tasks table (managed by task-service via Prisma)

Migrations run automatically at container startup via `prisma migrate deploy`.

To seed data locally (requires port-forward):

```bash
kubectl port-forward -n taskflow-dev pod/postgres-0 5432:5432 &

cd packages/database
DB_NAME=userdb DATABASE_URL="postgresql://taskflow:taskflow123@localhost:5432/userdb" \
  npx ts-node prisma/seed.ts

DB_NAME=taskdb DATABASE_URL="postgresql://taskflow:taskflow123@localhost:5432/taskdb" \
  npx ts-node prisma/seed.ts
```

## Development Notes

- Images are built with `--platform linux/amd64` for minikube compatibility
- `imagePullPolicy: Never` — images are built directly into minikube's Docker daemon
- OTLP exporter uses `http/protobuf` on port 4318 (gRPC causes silent failures on this setup)
- Promtail uses `cri: {}` pipeline stage for containerd log format
- Redis cache TTL is 30 seconds; rate limit is 100 requests/minute per IP

## CI/CD

GitHub Actions pipeline on every push:

- SonarCloud static analysis
- Commitlint (conventional commits enforced)
- Dependabot for dependency updates
- Husky pre-commit hooks (ESLint + Prettier)
