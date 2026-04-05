#!/bin/bash
set -e

cp k8s/overlays/dev/kustomization.yaml.template \
   k8s/overlays/dev/kustomization.yaml

echo "🔍 Checking minikube status..."
if ! minikube status --format='{{.Host}}' | grep -q "Running"; then
  echo "❌ Minikube is not running. Start it with: minikube start"
  exit 1
fi

# Point Docker commands at minikube's internal daemon.
# This is the key line that makes everything work — images built here
# are immediately available to Kubernetes without any registry push.
eval $(minikube docker-env)
echo "✅ Connected to minikube Docker daemon"

TAG=$(date +%Y%m%d%H%M%S)
echo "🔨 Building images with tag: $TAG"

# Build for amd64 — minikube's VM uses x86_64 even on Apple Silicon
for SERVICE in api-gateway user-service task-service; do
  docker build \
    --platform linux/amd64 \
    --network=host \
    -f apps/$SERVICE/Dockerfile \
    -t taskflow/$SERVICE:$TAG .
  echo "✅ Built $SERVICE:$TAG"
done

echo "📝 Updating kustomize image tags..."
cd k8s/overlays/dev
kustomize edit set image \
  taskflow/api-gateway=taskflow/api-gateway:$TAG \
  taskflow/user-service=taskflow/user-service:$TAG \
  taskflow/task-service=taskflow/task-service:$TAG
cd ../../..

echo "🚀 Deploying to taskflow-dev..."
kubectl apply -k k8s/overlays/dev
kubectl rollout restart deployment/api-gateway -n taskflow-dev
kubectl rollout restart deployment/user-service -n taskflow-dev
kubectl rollout restart deployment/task-service -n taskflow-dev

echo "✅ Finished deploying to taskflow-dev"