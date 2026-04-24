# ☕ CoffeeShop — Production-Grade CI/CD System

> **Tier 5: Kubernetes-Based Architecture**
> Full-stack coffee shop management system deployed on a production-grade K3s cluster with automated CI/CD, security scanning, and comprehensive monitoring.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Infrastructure Provisioning](#infrastructure-provisioning)
- [CI/CD Pipeline](#cicd-pipeline)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Extra Credit Features](#extra-credit-features)
- [Demo Scenario](#demo-scenario)
- [Local Development](#local-development)

---

## 🏗️ Architecture Overview

```
                         ┌─────────────────────────────────┐
                         │        Developer Workflow        │
                         │   git push → GitHub Actions      │
                         └────────────┬────────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │    CI/CD Pipeline (GitHub Actions)   │
                    │                                      │
                    │  ① Lint (ESLint)                     │
                    │  ② Test (Jest)                       │
                    │  ③ Build Docker Images               │
                    │  ④ Security Scan (Trivy)             │
                    │  ⑤ Push to GHCR                      │
                    │  ⑥ Deploy Staging → ⑦ Approve        │
                    │  ⑧ Deploy Production                 │
                    └─────────────────┬────────────────────┘
                                      │
              ┌───────────────────────▼───────────────────────┐
              │        Oracle Cloud (Always Free Tier)         │
              │                                                │
              │  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
              │  │  Master   │  │ Worker 1  │  │ Worker 2  │  │
              │  │  1CPU/6GB │  │ 1.5CPU/9GB│  │ 1.5CPU/9GB│  │
              │  │           │  │           │  │           │  │
              │  │ K3s Ctrl  │  │ Frontend  │  │ MongoDB   │  │
              │  │ Traefik   │  │ Backend   │  │ Prometheus│  │
              │  │ Ingress   │  │ (HPA)     │  │ Grafana   │  │
              │  └──────────┘  └───────────┘  └───────────┘  │
              │                                                │
              │  HTTPS via Let's Encrypt + cert-manager        │
              └────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 19 + React Router 7 |
| **Backend** | Node.js 20 + Express 5 |
| **Database** | MongoDB 6 |
| **Container** | Docker (multi-stage builds) |
| **Orchestration** | K3s (CNCF-certified Kubernetes) |
| **CI/CD** | GitHub Actions |
| **Registry** | GitHub Container Registry (ghcr.io) |
| **IaC** | Terraform (OCI provider) |
| **Config Mgmt** | Ansible |
| **Ingress** | Traefik (built-in K3s) |
| **TLS** | Let's Encrypt via cert-manager |
| **Monitoring** | Prometheus + Grafana + Alertmanager |
| **Security** | Trivy (container scanning) |
| **Cloud** | Oracle Cloud Infrastructure (Free Tier) |

---

## 📁 Project Structure

```
coffeeshop/
├── .github/workflows/
│   ├── ci.yml                    # CI: lint → test → build → scan → push
│   └── cd.yml                    # CD: staging → approve → production
├── terraform/
│   ├── main.tf                   # OCI provider + 3 ARM VMs
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # IPs, SSH commands, inventory
│   ├── terraform.tfvars.example  # Example values
│   └── modules/networking/       # VCN, subnet, firewall rules
├── ansible/
│   ├── playbook.yml              # K3s cluster setup (idempotent)
│   └── inventory.ini             # Node inventory
├── k8s/
│   ├── base/                     # Base Kubernetes manifests
│   │   ├── namespace.yaml        # staging, production, monitoring
│   │   ├── backend-deployment.yaml
│   │   ├── backend-service.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── frontend-service.yaml
│   │   ├── mongodb-statefulset.yaml
│   │   ├── mongodb-service.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml          # Template only
│   │   ├── ingress.yaml          # Traefik + TLS
│   │   ├── hpa.yaml              # Horizontal Pod Autoscaler
│   │   └── kustomization.yaml
│   ├── overlays/
│   │   ├── staging/              # 1 replica, lower resources
│   │   └── production/           # 2+ replicas, full resources
│   └── monitoring/
│       ├── prometheus-values.yaml
│       └── grafana-dashboards/
│           └── coffeeshop-dashboard.json
├── scripts/
│   ├── health-check.sh           # Post-deploy verification
│   └── rollback.sh               # Automated rollback
├── backend/
│   ├── Dockerfile                # Multi-stage, non-root, healthcheck
│   ├── .eslintrc.json            # Linting config
│   └── ...
├── frontend/
│   ├── Dockerfile                # Multi-stage, nginx, healthcheck
│   ├── nginx-k8s.conf            # K8s-optimized nginx
│   └── ...
└── docker-compose.yml            # Local development
```

---

## 🌐 Infrastructure Provisioning

### Option A: Infrastructure as Code (Recommended)

```bash
# 1. Configure OCI credentials
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform.tfvars with your OCI details

# 2. Provision 3 VMs on Oracle Cloud
cd terraform
terraform init
terraform plan
terraform apply

# 3. Install K3s cluster via Ansible
cd ../ansible
# Update inventory.ini with IPs from terraform output
ansible-playbook -i inventory.ini playbook.yml
```

### Option B: Manual Provisioning

1. Create 3 ARM VMs in Oracle Cloud Console
2. SSH into each and follow the Ansible playbook steps manually

### Idempotency Proof

```bash
# Running terraform apply again produces no changes
terraform apply
# Output: "No changes. Your infrastructure matches the configuration."
```

---

## 🔄 CI/CD Pipeline

### Continuous Integration (CI)

| Stage | Tool | Purpose |
|-------|------|---------|
| Lint Frontend | ESLint | Code quality for React |
| Lint Backend | ESLint | Code quality for Node.js |
| Test | Jest | Unit tests |
| Build | Docker Buildx | Multi-arch container images |
| Security Scan | Trivy | Vulnerability detection (FAIL on HIGH/CRITICAL) |
| Push | GHCR | Version-tagged images (commit SHA) |

### Continuous Delivery (CD)

| Stage | Feature | Extra Credit |
|-------|---------|-------------|
| Deploy Staging | Automatic after CI ✅ | 7.2 Multi-env |
| Approval Gate | Manual approval required | 7.2 Approval |
| Deploy Production | Rolling update (zero-downtime) | 7.3 Advanced Strategy |
| Health Check | HTTP 200 + pod readiness | — |
| Auto Rollback | On health failure → `kubectl rollout undo` | 7.4 Rollback |

---

## ☸️ Kubernetes Deployment

### Manual Deploy (first time)

```bash
# Create namespaces
kubectl apply -f k8s/base/namespace.yaml

# Deploy to staging
kustomize build k8s/overlays/staging | kubectl apply -f -

# Deploy to production
kustomize build k8s/overlays/production | kubectl apply -f -

# Install monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f k8s/monitoring/prometheus-values.yaml
```

### Key Kubernetes Features

- **Self-healing**: Liveness/readiness probes restart unhealthy pods
- **Rolling updates**: `maxSurge: 1, maxUnavailable: 0` for zero-downtime
- **HPA**: Auto-scales backend 2→8 pods based on CPU (>70%)
- **StatefulSet**: MongoDB with persistent volumes
- **Secrets**: Injected via CI/CD, never in Git

---

## 📊 Monitoring & Observability

| Component | URL | Purpose |
|-----------|-----|---------|
| Grafana | `https://grafana.yourdomain.com` | Dashboards & visualization |
| Prometheus | Internal | Metrics collection (15s interval) |
| Alertmanager | Internal | Alert routing |

### Dashboard Panels

- ☕ Cluster Overview (running pods, restarts, node count)
- 📊 CPU Usage by Pod & Node
- 💾 Memory Usage by Pod & Node
- 🚀 Pod Status Table (Running/Pending/Failed)
- 📈 HPA Current vs Desired Replicas
- 🔄 Container Restart History

### Alert Rules

- `PodRestartingTooOften`: >3 restarts/hour
- `HighCPUUsage`: >90% for 10 minutes
- `HighMemoryUsage`: >85% for 10 minutes
- `PodNotReady`: Not ready for 5 minutes

---

## ⭐ Extra Credit Features

| # | Feature | Status | Points |
|---|---------|--------|--------|
| 7.2 | Multi-Environment + Approval Gates | ✅ | 0.25–0.5 |
| 7.3 | Advanced Deployment (Rolling Update) | ✅ | 0.25–0.5 |
| 7.4 | Automated Rollback | ✅ | 0.25–0.5 |

---

## 🎬 Demo Scenario

1. **Code Change**: Modify visible UI element
2. **Commit & Push**: `git commit -m "feat: update title"` → `git push`
3. **CI Runs**: Lint ✅ → Test ✅ → Build ✅ → Trivy ✅ → Push ✅
4. **CD Runs**: Deploy Staging ✅ → Approve → Deploy Production ✅
5. **Verify**: Access `https://yourdomain.com` → confirm change
6. **Monitoring**: Open Grafana → show live metrics
7. **Failure Sim**: `kubectl delete pod <backend>` → K8s self-heals → Grafana shows restart

---

## 💻 Local Development

```bash
# Start all services locally
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# MongoDB:  mongodb://localhost:27017
```

---

## 📄 License

This project is developed for academic purposes as part of the Software Deployment, Operations & Maintenance course.