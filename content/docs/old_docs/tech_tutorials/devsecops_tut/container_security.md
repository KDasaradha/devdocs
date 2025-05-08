### ✅ **3. Container Security**  
- Docker Security Best Practices  
- Kubernetes Security (RBAC, Network Policies, Pod Security Policies)  
- Image Scanning (`Trivy`, `Anchore`, `Clair`)  
- Container Runtime Security (`Falco`)

---

#### Docker Security Best Practices
##### What is Docker?
- **Definition**: A platform for building, shipping, and running applications in containers—lightweight, isolated environments that share the host OS kernel.
- **Key Components**: Images (read-only templates), containers (running instances), Dockerfile (build instructions).

##### Security Risks
- Misconfigured containers (e.g., running as root).
- Vulnerable base images or dependencies.
- Exposed ports or weak networking.

##### Best Practices
1. **Use Official & Minimal Base Images**:
   - Choose trusted images (e.g., `alpine`, `debian-slim`) over bloated ones.
   - Example: `FROM alpine:3.18` instead of `FROM ubuntu:latest`.
2. **Run as Non-Root User**:
   - Add a user in Dockerfile:
     ```dockerfile
     RUN adduser -D myuser
     USER myuser
     ```
   - Avoid `root` privileges to limit damage if compromised.
3. **Minimize Attack Surface**:
   - Remove unnecessary tools (e.g., `apt`, `curl`) after installation:
     ```dockerfile
     RUN apk add --no-cache python3 && apk del curl
     ```
4. **Use Multi-Stage Builds**:
   - Keep build tools out of the final image:
     ```dockerfile
     FROM golang:1.20 AS builder
     WORKDIR /app
     COPY . .
     RUN go build -o myapp
     FROM alpine:3.18
     COPY --from=builder /app/myapp /usr/bin/myapp
     CMD ["myapp"]
     ```
5. **Secure Docker Daemon**:
   - Run Docker with a non-root user or restrict socket access (`/var/run/docker.sock`).
   - Enable TLS for remote API: `dockerd --tlsverify --tlscert=/path/to/cert`.
6. **Limit Capabilities**:
   - Drop unnecessary Linux capabilities:
     ```bash
     docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
     ```
7. **Set Resource Limits**:
   - Prevent DoS by limiting CPU/memory:
     ```bash
     docker run --memory="512m" --cpus="0.5" myapp
     ```
8. **Scan Images**: (Covered in "Image Scanning" below).
- **DevSecOps Angle**: Automate these practices in CI/CD (e.g., lint Dockerfiles with `hadolint`).

---

#### Kubernetes Security (RBAC, Network Policies, Pod Security Policies)
##### What is Kubernetes?
- **Definition**: An orchestration platform for managing containerized workloads at scale.
- **Security Scope**: Securing clusters, pods, and network communication.

##### Role-Based Access Control (RBAC)
- **Definition**: Controls who can perform actions (e.g., create pods) within a Kubernetes cluster.
- **Components**:
  - **Role/ClusterRole**: Defines permissions (e.g., `get`, `list`, `create`).
  - **RoleBinding/ClusterRoleBinding**: Assigns roles to users, groups, or service accounts.
- **Example**:
  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: Role
  metadata:
    namespace: dev
    name: dev-access
  rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: RoleBinding
  metadata:
    namespace: dev
    name: dev-binding
  subjects:
  - kind: User
    name: "dev-user"
  roleRef:
    kind: Role
    name: dev-access
    apiGroup: rbac.authorization.k8s.io
  ```
- **Best Practices**:
  - Follow least privilege: Grant only necessary permissions.
  - Avoid cluster-wide roles unless essential.
  - Audit RBAC with `kubectl auth can-i <verb> <resource>`.

##### Network Policies
- **Definition**: Rules to control traffic between pods and external entities.
- **Why Use?**: Default Kubernetes allows all pod-to-pod communication—too permissive.
- **Example** (Allow only specific ingress):
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: web-policy
    namespace: prod
  spec:
    podSelector:
      matchLabels:
        app: web
    policyTypes:
    - Ingress
    ingress:
    - from:
      - podSelector:
          matchLabels:
            app: api
      ports:
      - protocol: TCP
        port: 80
  ```
- **Best Practices**:
  - Deny all traffic by default, then allow specific flows.
  - Use namespaces to isolate workloads.
  - Test with tools like `kubepug` or `netpol`.

##### Pod Security Policies (Deprecated, Use Pod Security Standards)
- **Definition**: Cluster-wide rules to enforce pod security (e.g., no privileged containers).
- **Replacement**: Pod Security Standards (PSS) since K8s 1.21:
  - **Privileged**: No restrictions.
  - **Baseline**: Blocks common risks (e.g., root users).
  - **Restricted**: Strictest (e.g., no host namespaces).
- **Example (Apply Restricted PSS)**:
  ```yaml
  apiVersion: policy/v1
  kind: PodSecurityPolicy
  metadata:
    name: restricted
  spec:
    privileged: false
    runAsUser:
      rule: MustRunAsNonRoot
    seLinux:
      rule: RunAsAny
    fsGroup:
      rule: MustRunAs
      ranges:
      - min: 1000
        max: 1000
    volumes:
    - 'configMap'
    - 'secret'
  ```
- **Best Practices**:
  - Enforce PSS via admission controllers (e.g., Open Policy Agent).
  - Audit existing pods with `kubectl get pods --all-namespaces -o json | jq '.items[] | select(.spec.securityContext.runAsUser == 0)'`.

- **DevSecOps Integration**: Automate RBAC/Network Policy deployment via GitOps (e.g., ArgoCD).

---

#### Image Scanning (Trivy, Anchore, Clair)
##### Why Scan Images?
- Containers inherit vulnerabilities from base images and dependencies (e.g., CVEs in libraries).

##### Trivy
- **What is Trivy?**: A lightweight, open-source vulnerability scanner for containers and filesystems.
- **Features**: Fast, no external DB needed, supports Docker/Kubernetes.
- **Usage**:
  ```bash
  trivy image python:3.9
  ```
  Output: Lists CVEs (e.g., `CVE-2023-1234`) with severity.
- **CI/CD Integration** (GitLab):
  ```yaml
  scan_image:
    stage: test
    script:
      - trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
  ```
- **Best Practice**: Fail builds on high/critical vulnerabilities.

##### Anchore Engine
- **What is Anchore?**: A comprehensive container security platform for vulnerability scanning and policy enforcement.
- **Features**: Deep image analysis, custom policies, SBOM generation.
- **Usage**:
  1. Install: `docker-compose up -d` (with Anchore’s Docker Compose file).
  2. Scan: `anchore-cli image add myapp:latest && anchore-cli image vuln myapp:latest`.
- **CI/CD Integration** (Jenkins):
  ```groovy
  stage('Anchore Scan') {
      steps {
          sh 'anchore-cli image add myapp:latest'
          sh 'anchore-cli image wait myapp:latest'
          sh 'anchore-cli evaluate myapp:latest'
      }
  }
  ```
- **Best Practice**: Use policies to block non-compliant images.

##### Clair
- **What is Clair?**: An open-source static analysis tool for container vulnerabilities.
- **Features**: Integrates with registries, extensible vulnerability DB.
- **Usage**:
  1. Run Clair server: Docker-based deployment.
  2. Scan: `clairctl analyze -l myapp:latest`.
- **CI/CD Integration** (GitHub Actions):
  ```yaml
  - name: Clair Scan
    run: |
      docker run -v /var/run/docker.sock:/var/run/docker.sock clairctl analyze -l myapp:latest
  ```
- **Best Practice**: Update Clair’s vulnerability database regularly.

##### Comparison
| **Tool**   | **Speed** | **Ease of Use** | **Depth**      |
|------------|-----------|-----------------|----------------|
| **Trivy**  | Fast      | High            | Moderate       |
| **Anchore**| Moderate  | Moderate        | High (SBOM)    |
| **Clair**  | Moderate  | Low             | Moderate       |

---

#### Container Runtime Security (Falco)
##### What is Falco?
- **Definition**: An open-source runtime security tool for detecting and alerting on anomalous behavior in containers and Kubernetes.
- **How It Works**: Uses eBPF or kernel modules to monitor system calls, matching against rules.

##### Key Features
- Detects threats like unauthorized file access, privilege escalation, or suspicious processes.
- Outputs alerts to stdout, files, or external systems (e.g., Slack).

##### Setup
1. Install: `helm install falco falco-charts/falco`.
2. Default Rules: Detects common issues (e.g., container running as root).
3. Custom Rule Example:
   ```yaml
   - rule: Unexpected process spawned
     desc: Detects unexpected process execution in a container
     condition: spawned_process and proc.name = "malicious.exe"
     output: "Unexpected process (%proc.name) detected in container (%container.name)"
     priority: WARNING
   ```
4. Run: `falco -r custom-rules.yaml`.

##### CI/CD Integration
- Monitor production with Falco, not CI/CD directly—use logs or alerts:
  ```bash
  kubectl logs -f -l app=falco
  ```

##### Best Practices
- Tune rules to reduce false positives.
- Integrate with SIEM (e.g., Splunk) for centralized monitoring.

---

### Practical Workflow
1. **Docker**: Build a secure image with a non-root user and scan with Trivy.
2. **Kubernetes**: Deploy with RBAC, Network Policies, and Restricted PSS.
3. **CI/CD**: Add image scanning (e.g., Anchore) and fail on vulnerabilities.
4. **Runtime**: Monitor with Falco for real-time threats.

---

These notes provide a comprehensive foundation for securing containers in a DevSecOps pipeline. Let me know if you’d like deeper examples (e.g., a full Dockerfile) or integration with previous MkDocs navigation!