Below is an elaborate and in-depth set of notes for **Intermediate: Deploying & Managing Applications** in Kubernetes. These notes expand on your outline, providing detailed explanations, practical examples, and best practices tailored for intermediate Kubernetes users. The focus is on deploying and managing applications with manifests, networking, storage, configuration, autoscaling, and Helm, building on beginner concepts to prepare you for real-world scenarios.

---

# Intermediate: Deploying & Managing Applications in Kubernetes

## 🔹 What to Learn?
This section bridges basic Kubernetes knowledge to practical application management, introducing intermediate tools and techniques for deployment, networking, storage, and scaling.

---

### ✅ Working with Kubernetes Manifests (YAML)

#### Writing Pod, Deployment, and Service YAML Files
- **Purpose**: YAML files declaratively define Kubernetes resources.
- **Pod YAML**:
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: my-pod
  spec:
    containers:
    - name: nginx
      image: nginx:1.19
  ```
- **Deployment YAML**:
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: nginx-deployment
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: nginx
    template:
      metadata:
        labels:
          app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:1.19
  ```
- **Service YAML**:
  ```yaml
  apiVersion: v1
  kind: Service
  metadata:
    name: nginx-service
  spec:
    selector:
      app: nginx
    ports:
    - port: 80
      targetPort: 80
    type: ClusterIP
  ```

#### Creating & Managing Kubernetes Objects
- **`kubectl create`**: Imperative creation (less common for YAML).
  ```bash
  kubectl create deployment nginx --image=nginx --replicas=2
  ```
- **`kubectl apply`**: Declarative, preferred for YAML.
  ```bash
  kubectl apply -f file.yaml
  ```
- **`kubectl get`**: List resources.
  ```bash
  kubectl get pods,deployments,services
  ```
- **`kubectl delete`**: Remove resources.
  ```bash
  kubectl delete -f file.yaml
  ```
- **Tips**: Use `--dry-run=client -o yaml` to generate YAML templates.

#### Understanding Labels, Selectors, and Annotations
- **Labels**: Key-value pairs to identify resources.
  - Example: `app: nginx`, `env: prod`.
  - Add: `metadata.labels` in YAML.
- **Selectors**: Filter resources by labels.
  - `matchLabels`: Exact match in Deployments/Services.
  - Example: `kubectl get pods -l app=nginx`.
- **Annotations**: Non-identifying metadata (e.g., build info).
  - Example:
    ```yaml
    metadata:
      annotations:
        build-version: "1.0.0"
    ```

---

### ✅ Networking in Kubernetes

#### How Pods Communicate Inside a Cluster
- **Pod Networking**: Each Pod gets a unique IP in the cluster’s network.
- **Intra-Pod**: Containers in a Pod use `localhost`.
- **Inter-Pod**: Pods communicate via IP (managed by CNI plugin, e.g., Flannel).

#### DNS in Kubernetes
- **CoreDNS**: Provides name resolution.
- **Format**: `<service-name>.<namespace>.svc.cluster.local`.
- **Example**: Pod in `default` namespace accesses `nginx-service` as `nginx-service.default.svc.cluster.local`.

#### Ingress Controllers (NGINX, Traefik)
- **Purpose**: Manages external HTTP traffic (e.g., routing, TLS).
- **NGINX Ingress**:
  - Install (Minikube): `minikube addons enable ingress`.
  - Example:
    ```yaml
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: nginx-ingress
    spec:
      rules:
      - host: example.local
        http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-service
                port:
                  number: 80
    ```
  - Test: Add `example.local` to `/etc/hosts` with `minikube ip`.

#### Using Caddy as a Reverse Proxy
- **Caddy Deployment**:
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: caddy
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: caddy
    template:
      metadata:
        labels:
          app: caddy
      spec:
        containers:
        - name: caddy
          image: caddy:2
          volumeMounts:
          - name: caddyfile
            mountPath: /etc/caddy
        volumes:
        - name: caddyfile
          configMap:
            name: caddy-config
  ---
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: caddy-config
  data:
    Caddyfile: |
      :80 {
        reverse_proxy nginx-service:80
      }
  ```

---

### ✅ Persistent Storage in Kubernetes

#### Kubernetes Volumes
- **emptyDir**: Temporary, Pod-scoped.
  ```yaml
  volumes:
  - name: temp
    emptyDir: {}
  ```
- **hostPath**: Maps host directory (not portable).
  ```yaml
  volumes:
  - name: host-data
    hostPath:
      path: /data
  ```
- **PersistentVolume (PV)**: Cluster-wide storage resource.
  ```yaml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv-example
  spec:
    capacity:
      storage: 1Gi
    accessModes:
      - ReadWriteOnce
    hostPath:
      path: /mnt/data
  ```
- **PersistentVolumeClaim (PVC)**: Requests storage from PV.
  ```yaml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc-example
  spec:
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 1Gi
  ```

#### Storage Classes & Dynamic Provisioning
- **StorageClass**: Defines storage types (e.g., SSD, HDD).
  - Example (Minikube default):
    ```bash
    kubectl get storageclass
    ```
  - Use in PVC:
    ```yaml
    spec:
      storageClassName: standard
  ```

---

### ✅ ConfigMaps & Secrets

#### Storing Environment Variables in ConfigMaps
- **Create**:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: app-config
  data:
    DB_HOST: "postgres-service"
    ENV: "prod"
  ```
- **Use in Pod**:
  ```yaml
  spec:
    containers:
    - name: app
      env:
      - name: DB_HOST
        valueFrom:
          configMapKeyRef:
            name: app-config
            key: DB_HOST
  ```

#### Securing Credentials Using Secrets
- **Create**:
  ```bash
  kubectl create secret generic db-secret --from-literal=password=secret123
  ```
- **YAML**:
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: db-secret
  type: Opaque
  data:
    password: c2VjcmV0MTIz  # Base64: "secret123"
  ```
- **Use**:
  ```yaml
  spec:
    containers:
    - name: app
      env:
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: db-secret
            key: password
  ```

---

### ✅ Autoscaling in Kubernetes

#### Horizontal Pod Autoscaler (HPA)
- **Purpose**: Scales Pod replicas based on metrics (e.g., CPU).
- **Setup**:
  - Enable metrics: `minikube addons enable metrics-server`.
  - Example:
    ```yaml
    apiVersion: autoscaling/v2
    kind: HorizontalPodAutoscaler
    metadata:
      name: app-hpa
    spec:
      scaleTargetRef:
        apiVersion: apps/v1
        kind: Deployment
        name: app-deployment
      minReplicas: 1
      maxReplicas: 5
      metrics:
      - type: Resource
        resource:
          name: cpu
          target:
            type: Utilization
            averageUtilization: 50
    ```

#### Vertical Pod Autoscaler (VPA)
- **Purpose**: Adjusts Pod resource requests/limits (CPU, memory).
- **Note**: Requires VPA installation (not in Minikube by default).
- **Example**:
  ```yaml
  apiVersion: autoscaling.k8s.io/v1
  kind: VerticalPodAutoscaler
  metadata:
    name: app-vpa
  spec:
    targetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: app-deployment
    updatePolicy:
      updateMode: "Auto"
  ```

---

### ✅ Helm - Kubernetes Package Manager

#### What is Helm? Why Use It?
- **Definition**: A package manager for Kubernetes, bundling YAML files into reusable "charts."
- **Why Use It?**:
  - Simplifies deployment of complex apps.
  - Manages dependencies and versioning.
  - Templating reduces repetition.

#### Writing Helm Charts
- **Create**:
  ```bash
  helm create my-chart
  ```
- **Structure**:
  - `Chart.yaml`: Metadata (name, version).
  - `values.yaml`: Default variables.
  - `templates/`: YAML templates (e.g., `deployment.yaml`).
- **Customize `values.yaml`**:
  ```yaml
  replicaCount: 2
  image:
    repository: myusername/fastapi
    tag: latest
  ```

#### Deploying Applications Using Helm
- **Install**:
  ```bash
  helm install my-release ./my-chart
  ```
- **Upgrade**: `helm upgrade my-release ./my-chart`.
- **Uninstall**: `helm uninstall my-release`.

---

### ✅ Hands-on Projects

#### Project 1: Deploy FastAPI + PostgreSQL Using Kubernetes
- **Files**:
  - `fastapi-deployment.yaml`:
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: fastapi
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: fastapi
      template:
        metadata:
          labels:
            app: fastapi
        spec:
          containers:
          - name: fastapi
            image: myusername/fastapi:k8s
            envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: db-secret
    ```
  - `postgres-deployment.yaml`:
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: postgres
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: postgres
      template:
        metadata:
          labels:
            app: postgres
        spec:
          containers:
          - name: postgres
            image: postgres:13
            envFrom:
            - secretRef:
                name: db-secret
            volumeMounts:
            - name: pg-data
              mountPath: /var/lib/postgresql/data
          volumes:
          - name: pg-data
            persistentVolumeClaim:
              claimName: pg-pvc
    ```
  - `postgres-pvc.yaml`:
    ```yaml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: pg-pvc
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
    ```
  - `services.yaml`:
    ```yaml
    apiVersion: v1
    kind: Service
    metadata:
      name: fastapi-service
    spec:
      selector:
        app: fastapi
      ports:
      - port: 80
        targetPort: 80
      type: LoadBalancer
    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: postgres-service
    spec:
      selector:
        app: postgres
      ports:
      - port: 5432
        targetPort: 5432
    ```
- **Deploy**:
  ```bash
  kubectl apply -f .
  minikube service fastapi-service --url
  ```

#### Project 2: Secure Sensitive Data Using Secrets
- **Secret**:
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: db-secret
  type: Opaque
  data:
    POSTGRES_PASSWORD: cGFzc3dvcmQ=  # Base64: "password"
  ```
- **Use**: Integrated in above Deployment.

#### Project 3: Set Up an NGINX Ingress Controller
- **Enable**: `minikube addons enable ingress`.
- **Ingress**:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: fastapi-ingress
  spec:
    rules:
    - host: fastapi.local
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: fastapi-service
              port:
                number: 80
  ```
- **Test**: Update `/etc/hosts` with `minikube ip fastapi.local`.

---

## Additional Tips
- **Debugging**: `kubectl logs`, `kubectl describe`, `kubectl exec -it`.
- **Dry Run**: `kubectl apply -f file.yaml --dry-run=server`.
- **Helm Lint**: `helm lint ./my-chart`.

---

These notes provide a comprehensive intermediate Kubernetes foundation. Practice the projects to master deployment and management, and let me know if you’d like more depth or examples!

Yes, there’s definitely more to explore within **Intermediate: Deploying & Managing Applications** in Kubernetes! While your outline and my previous notes cover a solid set of intermediate topics—manifests, networking, storage, ConfigMaps/Secrets, autoscaling, and Helm—Kubernetes offers additional concepts and techniques at this level that can enhance your ability to deploy and manage applications effectively. Below, I’ll expand on these topics with more depth, additional tools, and practical insights, keeping it within the intermediate scope and building on what you’ve already learned.

---

# Intermediate: Deploying & Managing Applications in Kubernetes (Expanded)

---

## ✅ Working with Kubernetes Manifests (YAML) (Expanded)

### Advanced Manifest Management
- **Resource Limits and Requests**:
  - Define CPU/memory for Pods to ensure efficient scheduling and prevent resource hogging.
  - Example:
    ```yaml
    spec:
      containers:
      - name: nginx
        image: nginx
        resources:
          requests:  # Minimum needed
            memory: "64Mi"
            cpu: "250m"  # 0.25 CPU
          limits:  # Maximum allowed
            memory: "128Mi"
            cpu: "500m"  # 0.5 CPU
    ```
- **Taints and Tolerations**:
  - Taints mark Nodes to repel Pods; Tolerations allow Pods to schedule on tainted Nodes.
  - Example:
    ```yaml
    apiVersion: v1
    kind: Node
    metadata:
      name: node1
    spec:
      taints:
      - key: "dedicated"
        value: "app"
        effect: "NoSchedule"
    ---
    apiVersion: v1
    kind: Pod
    metadata:
      name: app-pod
    spec:
      tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "app"
        effect: "NoSchedule"
    ```

### Managing Objects Efficiently
- **Kustomize**: Built-in tool for customizing manifests without Helm.
  - Example:
    - `base/deployment.yaml`: Base Deployment.
    - `overlays/prod/kustomization.yaml`:
      ```yaml
      bases:
      - ../../base
      patchesStrategicMerge:
      - patch.yaml
      ```
    - `patch.yaml`: `replicas: 5`.
    - Apply: `kubectl apply -k overlays/prod`.
- **Batch Operations**:
  - Delete multiple: `kubectl delete -f dir/ --all`.
  - Label multiple: `kubectl label pods -l app=nginx env=prod`.

### Labels, Selectors, and Annotations (More Uses)
- **Selector Types**:
  - `matchExpressions`: More flexible than `matchLabels`.
    ```yaml
    selector:
      matchExpressions:
      - key: app
        operator: In
        values:
        - nginx
        - apache
    ```
- **Annotations for Tools**: Used by Ingress controllers, monitoring (e.g., Prometheus).
  - Example:
    ```yaml
    metadata:
      annotations:
        prometheus.io/scrape: "true"
    ```

---

## ✅ Networking in Kubernetes (Expanded)

### Network Policies
- **Purpose**: Control traffic between Pods (firewall-like rules).
- **Example**:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: allow-app-to-db
  spec:
    podSelector:
      matchLabels:
        app: fastapi
    policyTypes:
    - Egress
    egress:
    - to:
      - podSelector:
          matchLabels:
            app: postgres
      ports:
      - protocol: TCP
        port: 5432
  ```
- **Apply**: Restricts FastAPI Pods to only talk to PostgreSQL Pods on port 5432.

### Service Mesh Intro (e.g., Linkerd)
- **Why**: Adds observability, security (e.g., mTLS) to Pod communication.
- **Install (Linkerd)**:
  ```bash
  curl -sL https://run.linkerd.io/install | sh
  linkerd install | kubectl apply -f -
  ```
- **Inject**: `kubectl get deploy -o yaml | linkerd inject - | kubectl apply -f -`.

### ExternalName Service
- **Purpose**: Maps a Kubernetes Service to an external DNS name without proxying.
- **Example**:
  ```yaml
  apiVersion: v1
  kind: Service
  metadata:
    name: external-db
  spec:
    type: ExternalName
    externalName: db.example.com
  ```

---

## ✅ Persistent Storage in Kubernetes (Expanded)

### More Volume Types
- **ConfigMap/Secret Volumes**:
  - Mount as files:
    ```yaml
    spec:
      containers:
      - name: app
        volumeMounts:
        - name: config-vol
          mountPath: /etc/config
      volumes:
      - name: config-vol
        configMap:
          name: app-config
    ```
- **NFS**: Network storage (requires NFS server).
  ```yaml
  volumes:
  - name: nfs-data
    nfs:
      server: nfs-server.example.com
      path: /export
  ```

### Dynamic Provisioning in Minikube
- **Enable**: Uses `standard` StorageClass by default.
- **Test**:
  - PVC from previous notes auto-binds to a PV created by Minikube.

### Volume Snapshots (Intro)
- **Purpose**: Backup/restore volumes.
- **Example** (Requires CSI driver):
  ```yaml
  apiVersion: snapshot.storage.k8s.io/v1
  kind: VolumeSnapshot
  metadata:
    name: pg-snapshot
  spec:
    source:
      persistentVolumeClaimName: pg-pvc
  ```

---

## ✅ ConfigMaps & Secrets (Expanded)

### ConfigMap from Files
- **Create**:
  ```bash
  echo "key=value" > config.txt
  kubectl create configmap file-config --from-file=config.txt
  ```
- **Use**: Mount as volume or env.

### Secrets with Multiple Keys
- **Example**:
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: multi-secret
  data:
    username: YWRtaW4=  # admin
    password: cGFzc3dvcmQ=  # password
  ```
- **Use**:
  ```yaml
  env:
  - name: USERNAME
    valueFrom:
      secretKeyRef:
        name: multi-secret
        key: username
  ```

### Sealed Secrets (Intro)
- **Why**: Encrypt Secrets for Git storage.
- **Install**: `kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml`.
- **Create**: `kubeseal < secret.yaml > sealed-secret.yaml`.

---

## ✅ Autoscaling in Kubernetes (Expanded)

### Cluster Autoscaler (Intro)
- **Purpose**: Scales Nodes based on workload (cloud-specific, not Minikube default).
- **Minikube Simulation**:
  ```bash
  minikube start --nodes 2
  ```

### Custom Metrics for HPA
- **Setup**: Requires metrics server + custom adapter (e.g., Prometheus).
- **Example** (Requests per second):
  ```yaml
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  ```

---

## ✅ Helm - Kubernetes Package Manager (Expanded)

### Helm Chart Enhancements
- **Templates with Logic**:
  - `templates/deployment.yaml`:
    ```yaml
    replicas: {{ .Values.replicaCount }}
    {{- if .Values.env }}
    env:
    {{- range $key, $val := .Values.env }}
    - name: {{ $key }}
      value: {{ $val | quote }}
    {{- end }}
    {{- end }}
    ```
- **Dependencies**:
  - `Chart.yaml`:
    ```yaml
    dependencies:
    - name: postgresql
      version: "10.x.x"
      repository: "https://charts.bitnami.com/bitnami"
    ```
  - Update: `helm dependency update`.

### Helm Commands
- **List**: `helm list`.
- **Rollback**: `helm rollback my-release 1`.
- **Debug**: `helm install my-release ./my-chart --dry-run --debug`.

---

## ✅ Hands-on Projects (Expanded)

### Project 1: FastAPI + PostgreSQL with Network Policy
- **Add Network Policy**:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: fastapi-to-postgres
  spec:
    podSelector:
      matchLabels:
        app: fastapi
    policyTypes:
    - Egress
    egress:
    - to:
      - podSelector:
          matchLabels:
            app: postgres
      ports:
      - protocol: TCP
        port: 5432
  ```
- **Deploy**: Add to previous project files.

### Project 2: Secure Sensitive Data with Sealed Secrets
- **Create Sealed Secret**:
  ```bash
  kubectl create secret generic db-secret --from-literal=password=secret123 -o yaml | kubeseal > sealed-db-secret.yaml
  ```
- **Apply**: `kubectl apply -f sealed-db-secret.yaml`.

### Project 3: NGINX Ingress with Autoscaling
- **HPA**:
  ```yaml
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: fastapi-hpa
  spec:
    scaleTargetRef:
      kind: Deployment
      name: fastapi
    minReplicas: 2
    maxReplicas: 5
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  ```
- **Test**: Simulate load (e.g., `while true; do curl fastapi.local; done`).

---

## Additional Intermediate Concepts

### Jobs and CronJobs
- **Job**: Run-to-completion task.
  ```yaml
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: one-time-task
  spec:
    template:
      spec:
        containers:
        - name: task
          image: busybox
          command: ["echo", "Done!"]
        restartPolicy: Never
  ```
- **CronJob**: Scheduled tasks.
  ```yaml
  apiVersion: batch/v1
  kind: CronJob
  metadata:
    name: nightly-task
  spec:
    schedule: "0 0 * * *"
    jobTemplate:
      spec:
        template:
          spec:
            containers:
            - name: task
              image: busybox
              command: ["echo", "Nightly run"]
            restartPolicy: OnFailure
  ```

### Readiness and Liveness Probes
- **Purpose**: Health checks for Pods.
- **Example**:
  ```yaml
  spec:
    containers:
    - name: fastapi
      readinessProbe:
        httpGet:
          path: /health
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 10
      livenessProbe:
        httpGet:
          path: /health
          port: 80
        initialDelaySeconds: 15
        periodSeconds: 20
  ```

### RBAC (Role-Based Access Control) Intro
- **Role**:
  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: Role
  metadata:
    namespace: default
    name: pod-reader
  rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
  ```
- **RoleBinding**:
  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: RoleBinding
  metadata:
    name: read-pods
    namespace: default
  subjects:
  - kind: User
    name: "user1"
  roleRef:
    kind: Role
    name: pod-reader
    apiGroup: rbac.authorization.k8s.io
  ```

---

## Additional Tips
- **Alias**: `alias k=kubectl` for faster typing.
- **Watch**: `kubectl get pods -w` for live updates.
- **Explain**: `kubectl explain cronjob.spec` for field details.

---

These expanded notes deepen your intermediate Kubernetes skills with advanced manifests, networking policies, storage options, and more practical projects. Practice these to solidify your knowledge, and let me know if you’d like further exploration or examples!