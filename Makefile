# ============================================================
# Taskflow Development Makefile
# ============================================================
# Usage: make <target>
# Run 'make help' to see all available commands.
#
# Prerequisites:
#   - minikube installed and Docker Desktop running
#   - kubectl configured
#   - pnpm installed

# .PHONY tells make that these targets aren't files —
# without this, make would look for files named "help", "start", etc.
# and refuse to run them if such files existed in your directory.
.PHONY: help start stop setup deploy deploy-monitoring \
        grafana prometheus tempo loki promtail \
        status logs-gateway logs-task logs-user \
        tunnel clean

# ============================================================
# Self-documenting help target
# ============================================================
# This uses a clever awk trick: it scans the Makefile itself
# for lines that have a ## comment after the target name,
# then formats them into a help menu. This means your help
# output always stays in sync with your actual targets.
help:
	@echo "Taskflow Development Commands"
	@echo "=============================="
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ \
		{ printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ============================================================
# Cluster Lifecycle
# ============================================================

start: ## Start minikube with sufficient resources for the full stack
	minikube start --memory=4096 --cpus=2
	minikube addons enable ingress
	@echo "Waiting for ingress controller to be ready..."
	kubectl wait --namespace ingress-nginx \
		--for=condition=ready pod \
		--selector=app.kubernetes.io/component=controller \
		--timeout=120s
	@echo "✓ Minikube started and ingress enabled"
	@echo "Remember to run 'make tunnel' in a separate terminal!"

stop: ## Stop minikube (preserves cluster state)
	minikube stop

setup: ## Create namespaces — run this on a fresh cluster before deploying
	kubectl create namespace taskflow-dev --dry-run=client -o yaml | kubectl apply -f -
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	@echo "✓ Namespaces ready"

# ============================================================
# Deployment
# ============================================================

deploy: ## Build and deploy all application services to taskflow-dev
	eval $$(minikube docker-env) && ./scripts/dev-deploy.sh

deploy-monitoring: ## Deploy the full monitoring stack to the monitoring namespace
	kubectl apply -f k8s/monitoring/prometheus/prometheus.yaml
	kubectl apply -f k8s/monitoring/tempo/tempo.yaml
	kubectl apply -f k8s/monitoring/loki/loki.yaml
	kubectl apply -f k8s/monitoring/grafana/grafana.yaml
	kubectl apply -f k8s/monitoring/grafana/dashboards/dashboards.yaml
	kubectl apply -f k8s/monitoring/grafana/dashboards/red-dashboard.yaml
	@echo "✓ Monitoring stack deployed"

deploy-all: setup deploy deploy-monitoring ## Fresh deployment of everything (use after minikube restart)
	kubectl apply -f k8s/base/ingress.yml
# 	kubectl apply -f k8s/monitoring/grafana/ingress.yaml
	@echo "✓ Full stack deployed"

restart-services: ## Restart all application services (picks up ConfigMap changes)
	kubectl rollout restart deployment/api-gateway deployment/task-service deployment/user-service -n taskflow-dev
	kubectl rollout status deployment/api-gateway -n taskflow-dev

# ============================================================
# Observability Access
# ============================================================
# These commands port-forward to each component so you can
# access them directly without going through the Ingress.
# Useful for debugging when minikube tunnel isn't running.

grafana: ## Port-forward Grafana to localhost:3001
	@echo "Grafana available at http://localhost:3001 (admin/taskflow123)"
	kubectl port-forward -n monitoring deployment/grafana 3001:3000

prometheus: ## Port-forward Prometheus to localhost:9090
	@echo "Prometheus available at http://localhost:9090"
	kubectl port-forward -n monitoring deployment/prometheus 9090:9090

tempo: ## Port-forward Tempo to localhost:3200
	@echo "Tempo available at http://localhost:3200"
	kubectl port-forward -n monitoring deployment/tempo 3200:3200

loki: ## Port-forward Loki to localhost:3100
	@echo "Loki available at http://localhost:3100"
	kubectl port-forward -n monitoring deployment/loki 3100:3100

tunnel: ## Start minikube tunnel (required for taskflow.local and grafana.taskflow.local)
	@echo "Starting minikube tunnel — keep this terminal open"
	@echo "Access your services at:"
	@echo "  http://taskflow.local"
	@echo "  http://grafana.taskflow.local"
	minikube tunnel

# ============================================================
# Status and Debugging
# ============================================================

status: ## Show pod status across all project namespaces
	@echo "=== Application Services (taskflow-dev) ==="
	kubectl get pods -n taskflow-dev
	@echo ""
	@echo "=== Monitoring Stack (monitoring) ==="
	kubectl get pods -n monitoring
	@echo ""
	@echo "=== Ingress Rules ==="
	kubectl get ingress --all-namespaces

logs-gateway: ## Stream logs from api-gateway
	kubectl logs -n taskflow-dev deployment/api-gateway -f

logs-task: ## Stream logs from task-service
	kubectl logs -n taskflow-dev deployment/task-service -f

logs-user: ## Stream logs from user-service
	kubectl logs -n taskflow-dev deployment/user-service -f

logs-loki: ## Stream logs from Loki
	kubectl logs -n monitoring deployment/loki -f

logs-promtail: ## Stream logs from Promtail
	kubectl logs -n monitoring daemonset/promtail -f

check-otel: ## Verify OTLP endpoint configuration in all services
	@echo "=== api-gateway OTEL config ==="
	kubectl exec -n taskflow-dev deployment/api-gateway -- env | grep OTEL
	@echo ""
	@echo "=== task-service OTEL config ==="
	kubectl exec -n taskflow-dev deployment/task-service -- env | grep OTEL
	@echo ""
	@echo "=== user-service OTEL config ==="
	kubectl exec -n taskflow-dev deployment/user-service -- env | grep OTEL

# ============================================================
# Maintenance
# ============================================================

clean: ## Remove all project resources from the cluster (keeps minikube running)
	kubectl delete namespace taskflow-dev --ignore-not-found
	kubectl delete namespace monitoring --ignore-not-found
	@echo "✓ All project resources removed"

prune: ## Free up Docker disk space (run when disk is getting full)
	docker system prune -f
	@echo "✓ Docker cache cleared"
	@echo "Run 'make deploy-all' to rebuild everything"