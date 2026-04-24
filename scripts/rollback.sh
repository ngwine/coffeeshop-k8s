#!/bin/bash
# ============================================================
# CoffeeShop — Automated Rollback Script (Extra Credit 7.4)
# Reverts deployments to the previous stable revision
# Usage: ./rollback.sh <namespace>
# ============================================================
set -euo pipefail

NAMESPACE="${1:-production}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 ROLLBACK — Namespace: ${NAMESPACE}"
echo "   Timestamp: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Show current state before rollback ──
echo ""
echo "📋 Current state (BEFORE rollback):"
echo "─── Backend ───"
kubectl rollout history deployment/backend -n "${NAMESPACE}" | tail -5
echo ""
echo "─── Frontend ───"
kubectl rollout history deployment/frontend -n "${NAMESPACE}" | tail -5
echo ""
echo "─── Pods ───"
kubectl get pods -n "${NAMESPACE}" -l app=coffeeshop -o wide

# ── Perform rollback ──
echo ""
echo "⏪ Rolling back backend deployment..."
kubectl rollout undo deployment/backend -n "${NAMESPACE}"

echo "⏪ Rolling back frontend deployment..."
kubectl rollout undo deployment/frontend -n "${NAMESPACE}"

# ── Wait for rollback to complete ──
echo ""
echo "⏳ Waiting for rollback to stabilize..."
kubectl rollout status deployment/backend -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/frontend -n "${NAMESPACE}" --timeout=180s

# ── Verify rollback ──
echo ""
echo "📋 State AFTER rollback:"
echo "─── Backend ───"
kubectl rollout history deployment/backend -n "${NAMESPACE}" | tail -5
echo ""
echo "─── Frontend ───"
kubectl rollout history deployment/frontend -n "${NAMESPACE}" | tail -5
echo ""
echo "─── Pods ───"
kubectl get pods -n "${NAMESPACE}" -l app=coffeeshop -o wide

# ── Post-rollback health check ──
echo ""
echo "🏥 Running post-rollback health check..."
sleep 15  # Give pods time to fully start

BACKEND_PODS_READY=$(kubectl get pods -n "${NAMESPACE}" -l component=backend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | tr ' ' '\n' | grep -c "True" || echo "0")

if [ "${BACKEND_PODS_READY}" -gt 0 ]; then
  echo "✅ Rollback SUCCESSFUL — ${BACKEND_PODS_READY} backend pod(s) ready"
else
  echo "⚠️  Rollback completed but pods may still be initializing"
  echo "   Check manually: kubectl get pods -n ${NAMESPACE}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Rollback procedure complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
