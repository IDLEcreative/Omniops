# Kubernetes Deployment

**Type:** Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Prerequisites:** kubectl, Kubernetes cluster (1.24+)

## Purpose
Kubernetes manifests and deployment instructions for running Omniops in a production Kubernetes cluster.

## Quick Links
- [Docker Setup](../docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Capacity Planning](../docs/05-OPERATIONS/GUIDE_CAPACITY_PLANNING.md)
- [Disaster Recovery](../docs/05-OPERATIONS/RUNBOOK_DISASTER_RECOVERY.md)

## Directory Structure

```
k8s/
├── README.md                # This file
├── namespace.yaml          # Namespace definition
├── configmap.yaml          # Environment configuration
├── secrets.yaml.example    # Secret template (DO NOT COMMIT actual secrets)
├── deployment.yaml         # Application deployment
├── service.yaml           # Service definition
├── ingress.yaml           # Ingress configuration
├── hpa.yaml               # Horizontal Pod Autoscaler
└── network-policy.yaml    # Network security policies
```

## Prerequisites

1. **Kubernetes Cluster** (Version 1.24+)
   - Can use: EKS, GKE, AKS, or local (minikube/kind)
   - Minimum 3 nodes recommended for production

2. **kubectl** configured and connected to cluster
   ```bash
   kubectl version --client
   kubectl cluster-info
   ```

3. **Ingress Controller** (nginx-ingress recommended)
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```

4. **cert-manager** for TLS certificates
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

```bash
# Copy template
cp secrets.yaml.example secrets.yaml

# Edit with your actual values
# NEVER commit secrets.yaml to git!
vim secrets.yaml

# Apply secrets
kubectl apply -f secrets.yaml
```

### 3. Apply Configuration

```bash
# Apply all manifests
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
kubectl apply -f network-policy.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n omniops

# Check services
kubectl get svc -n omniops

# Check ingress
kubectl get ingress -n omniops

# View logs
kubectl logs -n omniops -l app=omniops-app --tail=50
```

## Configuration

### Environment Variables

Edit `configmap.yaml` for non-sensitive configuration:

```yaml
data:
  NODE_ENV: "production"
  NEXT_PUBLIC_APP_URL: "https://omniops.co.uk"
  REDIS_URL: "redis://redis-service:6379"
```

### Secrets Management

For production, use one of these methods:

1. **Kubernetes Secrets** (basic)
   ```bash
   kubectl create secret generic omniops-secrets \
     --from-literal=OPENAI_API_KEY=sk-... \
     --from-literal=SUPABASE_SERVICE_ROLE_KEY=... \
     -n omniops
   ```

2. **Sealed Secrets** (recommended)
   ```bash
   # Install sealed-secrets controller
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

   # Create sealed secret
   echo -n 'your-secret-value' | kubectl create secret generic omniops-secrets \
     --dry-run=client \
     --from-file=OPENAI_API_KEY=/dev/stdin \
     -o yaml | kubeseal -o yaml > sealed-secrets.yaml
   ```

3. **External Secrets Operator** (advanced)
   ```bash
   helm repo add external-secrets https://charts.external-secrets.io
   helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
   ```

## Scaling

### Horizontal Pod Autoscaler (HPA)

The HPA automatically scales pods based on CPU and memory:

```bash
# View HPA status
kubectl get hpa -n omniops

# Manual scaling
kubectl scale deployment omniops-app --replicas=5 -n omniops

# Edit HPA parameters
kubectl edit hpa omniops-app -n omniops
```

### Vertical Pod Autoscaler (VPA)

For automatic resource adjustment:

```bash
# Install VPA
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vertical-pod-autoscaler.yaml

# Apply VPA configuration
cat <<EOF | kubectl apply -f -
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: omniops-vpa
  namespace: omniops
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: omniops-app
  updatePolicy:
    updateMode: "Auto"
EOF
```

## Monitoring

### Prometheus & Grafana

```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Default login: admin/prom-operator
```

### Application Metrics

```yaml
# Add to deployment.yaml for metrics exposure
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/api/metrics"
```

## Networking

### Service Mesh (Optional - Istio)

```bash
# Install Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH
istioctl install --set profile=demo -y

# Enable sidecar injection
kubectl label namespace omniops istio-injection=enabled
```

### Network Policies

The included `network-policy.yaml` restricts traffic:
- Allows ingress from nginx-ingress only
- Allows egress to external services (Supabase, OpenAI)
- Blocks inter-pod communication except Redis

## Backup & Recovery

### Database Backup (CronJob)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: omniops
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump $DATABASE_URL > /backup/db-$(date +%Y%m%d).sql
              # Upload to S3 or other storage
          restartPolicy: OnFailure
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n omniops
   kubectl logs <pod-name> -n omniops --previous
   ```

2. **Service not accessible**
   ```bash
   kubectl get endpoints -n omniops
   kubectl port-forward svc/omniops-service 3000:3000 -n omniops
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress omniops-ingress -n omniops
   kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
   ```

4. **Secret issues**
   ```bash
   kubectl get secrets -n omniops
   kubectl describe secret omniops-secrets -n omniops
   ```

### Debug Container

```bash
# Run debug container
kubectl run -it --rm debug --image=busybox --restart=Never -n omniops -- sh

# Test connectivity from within cluster
wget -O- http://omniops-service:3000/api/health
```

## Production Checklist

- [ ] Resource limits set appropriately
- [ ] Health checks configured (liveness & readiness)
- [ ] Secrets managed securely (not in Git)
- [ ] Ingress with TLS configured
- [ ] Network policies applied
- [ ] HPA configured for auto-scaling
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan tested
- [ ] Security scanning enabled

## Helm Chart (Alternative)

For easier management, consider creating a Helm chart:

```bash
# Create Helm chart
helm create omniops-chart

# Install with Helm
helm install omniops ./omniops-chart -n omniops --create-namespace

# Upgrade deployment
helm upgrade omniops ./omniops-chart -n omniops

# Rollback if needed
helm rollback omniops -n omniops
```

## Clean Up

To remove all Kubernetes resources:

```bash
# Delete all resources in namespace
kubectl delete -f .

# Delete namespace (removes everything)
kubectl delete namespace omniops

# If using Helm
helm uninstall omniops -n omniops
```

## Security Best Practices

1. **Use namespaces** to isolate resources
2. **Apply network policies** to restrict traffic
3. **Use RBAC** for access control
4. **Scan images** for vulnerabilities
5. **Rotate secrets** regularly
6. **Enable audit logging**
7. **Use Pod Security Standards**

```bash
# Apply Pod Security Standards
kubectl label namespace omniops pod-security.kubernetes.io/enforce=restricted
```

## Cost Optimization

1. **Use spot/preemptible instances** for non-critical workloads
2. **Implement cluster autoscaler** to scale nodes
3. **Use HPA and VPA** for efficient resource usage
4. **Schedule non-critical pods** on cheaper nodes
5. **Clean up unused resources** regularly

```bash
# Find unused resources
kubectl get pods --all-namespaces | grep -E "Evicted|Error|Completed"
kubectl get pv | grep Released
```