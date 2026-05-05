# ☕ CoffeeShop — Production-Grade CI/CD System

> **Architecture Tier: 5 — Kubernetes-Based (Expert)**
>
> A full-stack coffee shop management platform deployed on a production-grade K3s Kubernetes cluster with fully automated CI/CD pipelines, integrated security scanning, multi-environment deployment, and comprehensive monitoring & observability.

| | |
|---|---|
| **Live URL** | [https://coffeeshopk8s.me](https://coffeeshopk8s.me) |
| **Grafana** | [https://grafana.coffeeshopk8s.me](https://grafana.coffeeshopk8s.me) |
| **Container Registry** | [ghcr.io/ngwine/coffeeshop-*](https://github.com/ngwine?tab=packages) |
| **Repository** | [github.com/ngwine/coffeeshop-k8s](https://github.com/ngwine/coffeeshop-k8s) |

---

## 📋 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Technology Stack](#️-technology-stack)
3. [Project Structure](#-project-structure)
4. [Infrastructure Provisioning (IaC)](#-infrastructure-provisioning-iac)
5. [CI/CD Pipeline](#-cicd-pipeline)
6. [Kubernetes Deployment](#️-kubernetes-deployment)
7. [Monitoring & Observability](#-monitoring--observability)
8. [Security Practices](#-security-practices)
9. [Extra Credit Features](#-extra-credit-features)
10. [Demo Scenario](#-demo-scenario)
11. [Local Development](#-local-development)

---

## 🏗️ Architecture Overview

The system follows a Tier 5 (Kubernetes) architecture deployed on DigitalOcean infrastructure, provisioned via Terraform and configured via Ansible. The CI/CD pipeline is fully automated through GitHub Actions, deploying containerized services to a K3s cluster with multi-environment support.

```
               ┌─────────────────────────────────────────┐
               │           Developer Workflow            │
               │       git push → GitHub Actions         │
               └───────────────────┬─────────────────────┘
                                   │
               ┌───────────────────▼─────────────────────┐
               │      CI Pipeline (GitHub Actions)       │
               │                                         │
               │ ① Lint (ESLint — Frontend + Backend)   │
               │ ② Test (Jest — Unit Tests)             │
               │ ③ Build (Docker Multi-stage)           │
               │ ④ Security Scan (Trivy — FAIL on       │
               │    HIGH/CRITICAL vulnerabilities)       │
               │ ⑤ Push to GHCR (version-tagged)        │
               └───────────────────┬─────────────────────┘
                                   │ workflow_run trigger
               ┌───────────────────▼─────────────────────┐
               │      CD Pipeline (GitHub Actions)       │
               │                                         │
               │ ⑥ Deploy to Staging (automatic)        │
               │ ⑦ Manual Approval Gate                 │
               │ ⑧ Deploy to Production                 │
               │    (Rolling Update — zero downtime)     │
               │ ⑨ Health Check + Auto Rollback         │
               └───────────────────┬─────────────────────┘
                                   │
               ┌───────────────────▼─────────────────────┐
               │        DigitalOcean K3s Cluster         │
               │        Region: SGP1 (Singapore)         │
               │                                         │
               │ ┌─────────────────────────────────────┐ │
               │ │ Single Node (control-plane + worker)│ │
               │ │ 8GB RAM / 160GB Disk / Ubuntu 24.04 │ │
               │ │                                     │ │
               │ │ K3s API    │ Frontend   │ MongoDB   │ │
               │ │ Nginx IC   │ Backend    │ Prometheus│ │
               │ │ Cert-Mgr   │ HPA        │ Grafana   │ │
               │ └─────────────────────────────────────┘ │
               │                                         │
               │ ┌─────────────────────────────────────┐ │
               │ │        Networking & Security        │ │
               │ │ • Cloud Firewall (SSH, HTTP/S, K8s) │ │
               │ │ • TLS (Let's Encrypt + cert-manager)│ │
               │ │ • Nginx Ingress Controller          │ │
               │ └─────────────────────────────────────┘ │
               └─────────────────────────────────────────┘
```

### Deployment Flow

```
Source Code → CI (Lint → Test → Build → Scan → Push) → CD (Staging → Approve → Production)
                                                                                    │
                                                              Health Check ─── PASS ──→ ✅ Done
                                                                    │
                                                                  FAIL ──→ 🔄 Auto Rollback
```

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React + React Router | 19.x / 7.x | Single-page application |
| **Backend** | Node.js + Express | 20.x / 5.x | RESTful API + WebSocket |
| **Database** | MongoDB | 6.x | Document database (StatefulSet) |
| **Containerization** | Docker | Multi-stage | Optimized production images |
| **Orchestration** | K3s | v1.35 | CNCF-certified lightweight Kubernetes |
| **CI/CD** | GitHub Actions | — | Automated pipeline (CI + CD workflows) |
| **Registry** | GitHub Container Registry | ghcr.io | Private container image storage |
| **IaC – Provisioning** | Terraform | ≥ 1.5 | DigitalOcean resource creation |
| **IaC – Configuration** | Ansible | — | K3s cluster setup (idempotent) |
| **Ingress** | Nginx Ingress Controller | — | External traffic routing + TLS termination |
| **TLS** | Let's Encrypt + cert-manager | — | Automatic HTTPS certificate management |
| **Monitoring** | Prometheus | — | Metrics collection (15s scrape interval) |
| **Visualization** | Grafana | — | Dashboards & alerting UI |
| **Alerting** | Alertmanager | — | Alert routing & notification |
| **Security** | Trivy | — | Container vulnerability scanning |
| **Cloud Provider** | DigitalOcean | — | Droplets, VPC, Cloud Firewall |

---

## 📁 Project Structure

```
coffeeshop-k8s/
│
├── .github/workflows/
│   ├── ci.yml                         # CI: Lint → Test → Build → Scan → Push to GHCR
│   └── cd.yml                         # CD: Staging → Approval Gate → Production (Rolling Update)
│
├── terraform/                         # Infrastructure as Code (DigitalOcean)
│   ├── main.tf                        # 1x Droplet + VPC + Cloud Firewall + DO Project
│   ├── variables.tf                   # Input variables (token, region, size)
│   ├── outputs.tf                     # Public IPs, SSH commands, Ansible inventory
│   └── terraform.tfvars.example       # Example variable values (no secrets)
│
├── ansible/                           # Configuration Management
│   ├── playbook.yml                   # K3s master + worker setup, Helm, cert-manager (idempotent)
│   └── inventory.ini                  # Node inventory template
│
├── k8s/                               # Kubernetes Manifests
│   ├── base/                          # Base resources (shared by all environments)
│   │   ├── kustomization.yaml         # Kustomize entry point
│   │   ├── namespace.yaml             # staging, production, monitoring namespaces
│   │   ├── configmap.yaml             # Non-sensitive app configuration
│   │   ├── secrets.yaml               # Secret template (values injected by CI/CD)
│   │   ├── backend-deployment.yaml    # Backend: 2 replicas, rolling update, probes
│   │   ├── backend-service.yaml       # ClusterIP service (port 3001)
│   │   ├── frontend-deployment.yaml   # Frontend: 2 replicas, Nginx SPA server
│   │   ├── frontend-service.yaml      # ClusterIP service (port 80)
│   │   ├── mongodb-statefulset.yaml   # MongoDB: StatefulSet with 10Gi PVC
│   │   ├── mongodb-service.yaml       # Headless service for stable DNS
│   │   ├── ingress.yaml               # Nginx Ingress + TLS (cert-manager)
│   │   └── hpa.yaml                   # HPA: backend 2→8 pods, frontend 2→4 pods
│   │
│   ├── overlays/                      # Environment-specific overrides (Kustomize)
│   │   ├── staging/                   # 1 replica, reduced resources, staging domain
│   │   │   ├── kustomization.yaml
│   │   │   └── namespace.yaml
│   │   └── production/                # 2+ replicas, full resources, production domain
│   │       ├── kustomization.yaml
│   │       └── namespace.yaml
│   │
│   └── monitoring/                    # Observability Stack
│       ├── prometheus-values.yaml     # Helm values for kube-prometheus-stack
│       └── grafana-dashboards/
│           └── coffeeshop-dashboard.json   # Custom Grafana dashboard (exported JSON)
│
├── scripts/                           # Operational Scripts
│   ├── health-check.sh                # Post-deploy health verification
│   └── rollback.sh                    # Manual rollback utility
│
├── backend/                           # Node.js Express API
│   ├── Dockerfile                     # Multi-stage build, non-root user (UID 1001)
│   ├── .eslintrc.json                 # ESLint configuration
│   ├── index.js                       # App entry point (/health endpoint)
│   └── ...                            # Controllers, models, routes, middleware
│
├── frontend/                          # React SPA
│   ├── Dockerfile                     # Multi-stage build → Nginx static server
│   ├── nginx-k8s.conf                 # Kubernetes-optimized Nginx config (SPA fallback)
│   └── ...                            # Components, pages, services
│
├── docker-compose.yml                 # Local development (2x backend + Nginx LB)
├── .trivyignore                       # Security scan allowlist (documented CVEs)
└── .gitignore                         # Excludes secrets, tfstate, node_modules, keys
```

---

## 🌐 Infrastructure Provisioning (IaC)

Infrastructure is managed using a two-phase IaC approach:

### Phase 1: Resource Provisioning (Terraform)

Terraform provisions all cloud resources on DigitalOcean:

| Resource | Type | Configuration |
|----------|------|---------------|
| 1× Droplet | `s-4vcpu-8gb` | Ubuntu 24.04, single-node K3s (control-plane + worker) |
| VPC | Private network | `10.10.10.0/24`, region `sgp1` |
| Cloud Firewall | Security rules | SSH, HTTP/S, K8s API, NodePort |
| Project | Resource grouping | All resources under one DO Project |

> **Note**: Terraform configuration supports multi-node expansion (1 master + 2 workers). Currently deployed as a single-node cluster for cost optimization.

```bash
# Provision infrastructure
cd terraform
cp terraform.tfvars.example terraform.tfvars   # Fill in DO API token
terraform init                                  # Initialize providers
terraform plan                                  # Preview changes
terraform apply                                 # Create resources
```

**Idempotency**: Running `terraform apply` a second time produces:
```
No changes. Your infrastructure matches the configuration.
```

### Phase 2: Cluster Configuration (Ansible)

Ansible configures the K3s cluster with a single idempotent playbook:

| Play | Target | Actions |
|------|--------|---------|
| Common Setup | All nodes | System packages, firewall rules, IP forwarding |
| K3s Server | Master | Install K3s, Helm, cert-manager, Let's Encrypt ClusterIssuer |
| K3s Agent | Workers | Join workers to cluster with node token (when multi-node) |
| Verification | Master | Assert cluster is fully operational |

```bash
# Configure cluster
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

All tasks use `when` conditionals and `changed_when` to ensure idempotent execution.

---

## 🔄 CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggered automatically on every `push` or `pull_request` to `main`.

```
┌───────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Lint (ESLint)│────▶│  Test (Jest) │────▶│ Build Images │────▶│ Trivy Scan   │────▶│ Push to GHCR │
│  Frontend +   │     │  Backend     │     │ Backend +    │     │ HIGH/CRITICAL│     │ SHA-tagged   │
│  Backend      │     │  Unit Tests  │     │ Frontend     │     │ = FAIL ❌    │     │ images       │
└───────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Stage | Tool | Details |
|-------|------|---------|
| **Lint Frontend** | ESLint | React code quality (`npx eslint src/`) |
| **Lint Backend** | ESLint | Node.js code quality (`npx eslint .`) |
| **Test** | Jest | Unit tests with coverage (`--ci --coverage`) |
| **Build** | Docker Buildx | Multi-stage images with GitHub Actions cache (`type=gha`) |
| **Security Scan** | Trivy | Exit code 1 on HIGH/CRITICAL; allowlist in `.trivyignore` |
| **Push** | GHCR | Tags: `${SHORT_SHA}-${TIMESTAMP}` (never `latest`) |

**Dependency Caching**: `node_modules` cached via `actions/cache@v4` keyed on `package-lock.json` hash.

### Continuous Delivery (`cd.yml`)

Triggered automatically when CI pipeline completes successfully on `main`.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Deploy to    │────▶│ Manual       │────▶│ Deploy to    │────▶│ Health Check │────▶│ ✅ Done /    │
│ Staging      │     │ Approval     │     │ Production   │     │ Pod Ready?   │     │ 🔄 Rollback  │
│ (automatic)  │     │ Gate 🔐      │     │ Rolling Upd. │     │ HTTP 200?    │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Stage | Details |
|-------|---------|
| **Deploy Staging** | Auto-deploy to `staging` namespace after CI success |
| **Approval Gate** | GitHub Environment protection rule — requires manual approval |
| **Deploy Production** | Rolling update (`maxSurge: 1, maxUnavailable: 0`) — zero downtime |
| **Health Check** | Verify pod readiness + HTTP endpoint accessibility |
| **Auto Rollback** | On failure → `kubectl rollout undo` restores previous revision |

**Deployment Method**: SSH into K3s master → `docker pull` → `k3s ctr images import` → `kustomize build` → `kubectl apply` → `kubectl set image`

---

## ☸️ Kubernetes Deployment

### Resource Summary

| Resource | Kind | Replicas | Key Features |
|----------|------|----------|-------------|
| Backend | Deployment | 2 (HPA: 2→8) | Rolling update, liveness/readiness/startup probes, non-root |
| Frontend | Deployment | 2 (HPA: 2→4) | Nginx SPA, rolling update, health probes |
| MongoDB | StatefulSet | 1 | Persistent Volume (10Gi), headless service |
| Ingress | Ingress | — | Nginx IC, TLS (cert-manager), path-based routing |
| HPA | HorizontalPodAutoscaler | — | CPU 70% (backend), 75% (frontend) |
| ConfigMap | ConfigMap | — | `MONGO_URI`, `CORS_ORIGINS`, `API_BASE_URL` |
| Secrets | Secret | — | Template in Git; actual values injected via CI/CD pipeline |

### Kubernetes Primitives Demonstrated

- **Deployments**: Declarative pod management with `revisionHistoryLimit: 5`
- **Services**: ClusterIP for internal communication
- **Ingress**: Path-based routing (`/api` → backend, `/` → frontend)
- **StatefulSet**: MongoDB with stable network identity and PVC
- **ConfigMaps & Secrets**: Environment-specific configuration
- **HPA**: Horizontal Pod Autoscaler based on CPU/memory metrics
- **Kustomize Overlays**: Base + staging/production environment overrides
- **Namespaces**: `staging`, `production`, `monitoring` isolation

### Self-Healing Behavior

| Probe | Backend | Frontend |
|-------|---------|----------|
| **Readiness** | `GET /health:3001` every 10s | `GET /:80` every 10s |
| **Liveness** | `GET /health:3001` every 15s | `GET /:80` every 15s |
| **Startup** | `GET /health:3001` × 12 attempts (60s max) | — |

### First-Time Manual Setup

```bash
# 1. Create namespaces
kubectl apply -f k8s/base/namespace.yaml

# 2. Deploy to staging
kustomize build k8s/overlays/staging | kubectl apply -f -

# 3. Deploy to production
kustomize build k8s/overlays/production | kubectl apply -f -

# 4. Install monitoring stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f k8s/monitoring/prometheus-values.yaml
```

---

## 📊 Monitoring & Observability

### Stack Components

| Component | Access | Purpose |
|-----------|--------|---------|
| **Prometheus** | Internal (ClusterIP) | Metrics collection — 15s scrape interval, 7-day retention |
| **Grafana** | [https://grafana.coffeeshopk8s.me](https://grafana.coffeeshopk8s.me) | Dashboard visualization & alerting UI |
| **Alertmanager** | Internal | Alert routing with group-based deduplication |
| **Node Exporter** | Internal | Host-level system metrics (CPU, memory, disk) |
| **kube-state-metrics** | Internal | Kubernetes object state metrics |

### Grafana Dashboard Panels

| Panel | Metric |
|-------|--------|
| ☕ Cluster Overview | Running pods, total restarts, node count |
| 📊 CPU Usage | Per-pod and per-node CPU utilization |
| 💾 Memory Usage | Per-pod and per-node memory consumption |
| 🚀 Pod Status Table | Running / Pending / Failed breakdown |
| 📈 HPA Scaling | Current vs desired replica count |
| 🔄 Restart History | Container restart count over time |

### Alert Rules (Alertmanager)

| Alert Name | Condition | Severity |
|------------|-----------|----------|
| `PodRestartingTooOften` | > 3 restarts in 1 hour | ⚠️ Warning |
| `HighCPUUsage` | > 90% for 10 minutes | ⚠️ Warning |
| `HighMemoryUsage` | > 85% for 10 minutes | ⚠️ Warning |
| `PodNotReady` | Not ready for 5 minutes | 🔴 Critical |

---

## 🔒 Security Practices

| Practice | Implementation |
|----------|---------------|
| **Container Scanning** | Trivy in CI — pipeline fails on HIGH/CRITICAL CVEs |
| **Vulnerability Allowlist** | `.trivyignore` with documented risk acceptance for each CVE |
| **Non-root Containers** | Backend runs as UID 1001 (`securityContext.runAsNonRoot: true`) |
| **Secret Management** | Secrets template in Git (placeholder values); real values injected via `kubectl create secret` in CD pipeline using GitHub Actions Secrets |
| **No Hardcoded Secrets** | `.gitignore` excludes `.env`, `terraform.tfvars`, SSH keys, kubeconfig |
| **HTTPS Everywhere** | cert-manager + Let's Encrypt with auto-renewal |
| **Network Isolation** | DigitalOcean VPC + Cloud Firewall; internal ports restricted to VPC CIDR |
| **Security Headers** | Nginx: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` |
| **Multi-stage Builds** | Production images contain only runtime dependencies (no dev tools) |

---

## ⭐ Extra Credit Features

### 7.2 — Multi-Environment Deployment with Approval Gates

| Environment | Namespace | Trigger | Replicas |
|-------------|-----------|---------|----------|
| **Staging** | `staging` | Automatic after CI success | 1 per service |
| **Production** | `production` | After manual approval in GitHub | 2+ per service (HPA) |

- Separate Kustomize overlays with environment-specific resource limits, domain names, and CORS settings
- GitHub Environment protection rules enforce manual approval before production deployment

### 7.3 — Advanced Deployment Strategy (Rolling Update)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1          # Create 1 new pod before terminating old
    maxUnavailable: 0    # Zero-downtime guarantee
```

- New pods must pass readiness probes before old pods are terminated
- `revisionHistoryLimit: 5` preserves rollback targets

### 7.4 — Automated Rollback Mechanism

The CD pipeline implements automated rollback triggered by health check failure:

1. After deployment, the pipeline checks pod readiness via `kubectl get pods`
2. If backend pods are not in `Ready` state → rollback is triggered
3. `kubectl rollout undo deployment/backend -n production` restores the previous revision
4. Rollback status is reported in GitHub Actions step summary

Additionally, a standalone `scripts/rollback.sh` is provided for manual rollback operations.

---

## 🎬 Demo Scenario (Section V)

The following sequence follows the mandatory demonstration defined in the project specification:

| Step | Action | Verification |
|------|--------|-------------|
| **5.1** | Modify visible UI element in source code | Observable change in frontend |
| **5.2** | `git commit -m "feat: update title"` → `git push` | Pipeline triggers automatically |
| **5.3** | CI pipeline executes | Lint ✅ → Test ✅ → Build ✅ → Trivy ✅ → Push ✅ |
| **5.4** | CD pipeline deploys | Staging ✅ → Manual Approval → Production ✅ |
| **5.5** | Access `https://coffeeshopk8s.me` | Confirm UI change is live, HTTPS valid |
| **5.6** | Open `https://grafana.coffeeshopk8s.me` | Show CPU, memory, pod status metrics |
| **5.7** | `kubectl delete pod <backend-pod> -n production` | K8s self-heals → new pod created → Grafana shows restart |

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/ngwine/coffeeshop-k8s.git
cd coffeeshop-k8s

# Start all services locally with Docker Compose
docker-compose up --build

# Access points:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:3001  (load-balanced via Nginx)
#   MongoDB:   mongodb://localhost:27017
```

The local `docker-compose.yml` runs 2 backend instances behind an Nginx reverse proxy to simulate the production load-balancing setup.

---

## 📄 License

This project is developed for academic purposes as part of the **Software Deployment, Operations & Maintenance** course — Final Exam Project (Tier 5: Kubernetes-Based Architecture).