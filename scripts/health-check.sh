#!/bin/bash
# ============================================================
# CoffeeShop — Post-Deploy Health Check Script
# Verifies the application is healthy after deployment
# Usage: ./health-check.sh <namespace>
# ============================================================
set -euo pipefail

NAMESPACE="${1:-production}"
MAX_RETRIES=10
RETRY_DELAY=15
HEALTH_ENDPOINT="${HEALTH_URL:-http://localhost:3001/health}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Health Check — Namespace: ${NAMESPACE}"
echo "   Endpoint: ${HEALTH_ENDPOINT}"
echo "   Max retries: ${MAX_RETRIES} (interval: ${RETRY_DELAY}s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Check pod status first ──
echo ""
echo "📋 Pod Status:"
kubectl get pods -n "${NAMESPACE}" -l app=coffeeshop

# Wait for all pods to be ready
echo ""
echo "⏳ Waiting for all pods to be Ready..."
kubectl wait --for=condition=Ready pods -l app=coffeeshop -n "${NAMESPACE}" --timeout=120s || {
  echo "❌ Pods failed to reach Ready state"
  kubectl describe pods -n "${NAMESPACE}" -l app=coffeeshop | tail -20
  exit 1
}

# ── HTTP Health Check ──
echo ""
echo "🔍 Running HTTP health checks..."

for i in $(seq 1 "${MAX_RETRIES}"); do
  echo "   Attempt ${i}/${MAX_RETRIES}..."

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_ENDPOINT}" --connect-timeout 10 --max-time 30 2>/dev/null || echo "000")

  if [ "${HTTP_STATUS}" = "200" ]; then
    RESPONSE=$(curl -s "${HEALTH_ENDPOINT}" --connect-timeout 10 --max-time 30 2>/dev/null)
    echo ""
    echo "✅ Health check PASSED (HTTP ${HTTP_STATUS})"
    echo "   Response: ${RESPONSE}"
    echo ""
    echo "📊 Current pod status:"
    kubectl get pods -n "${NAMESPACE}" -l app=coffeeshop -o wide
    exit 0
  fi

  echo "   ⚠️  HTTP ${HTTP_STATUS} — retrying in ${RETRY_DELAY}s..."
  sleep "${RETRY_DELAY}"
done

echo ""
echo "❌ Health check FAILED after ${MAX_RETRIES} attempts"
echo ""
echo "📊 Pod status:"
kubectl get pods -n "${NAMESPACE}" -l app=coffeeshop -o wide
echo ""
echo "📋 Recent events:"
kubectl get events -n "${NAMESPACE}" --sort-by='.lastTimestamp' | tail -15
exit 1
