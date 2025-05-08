Below is an elaborate and in-depth set of notes for **Intermediate: Docker in Development & Production**. These notes expand on your outline, providing detailed explanations, practical examples, and best practices tailored for intermediate Docker users. The focus is on multi-container setups, image optimization, environment management, orchestration intro, debugging, and hands-on projects—building on beginner fundamentals to prepare you for real-world development and production scenarios.

---

# Intermediate: Docker in Development & Production

## 🔹 What to Learn?
This section bridges the gap between basic Docker usage and production-ready workflows, introducing tools like Docker Compose, optimization techniques, and an entry into orchestration with Kubernetes.

---

### ✅ Multi-container Applications: Docker Compose

#### What is Docker Compose?
- **Definition**: A tool for defining and running multi-container Docker applications using a single YAML file (`docker-compose.yml`). It simplifies managing interconnected services.
- **Why Use It?**
  - Coordinates multiple containers (e.g., app + database).
  - Handles networking and dependencies automatically.
  - Ideal for development, testing, and small-scale production.

#### Writing `docker-compose.yml`
- **Structure**: Defines services, networks, and volumes.
- **Key Fields**:
  - `services`: Containers to run.
  - `image`: Use an existing image or build from a Dockerfile.
  - `ports`: Map host-to-container ports.
  - `volumes`: Persistent storage.
  - `environment`: Set env vars.
- **Basic Example**:
  ```yaml
  version: '3.8'
  services:
    web:
      image: nginx
      ports:
        - "80:80"
    db:
      image: postgres
      environment:
        POSTGRES_PASSWORD: example
  ```

#### Running Multiple Containers (`docker-compose up`)
- **Commands**:
  - `docker-compose up`: Start all services (foreground).
  - `docker-compose up -d`: Run in detached mode.
  - `docker-compose down`: Stop and remove containers.
  - `docker-compose ps`: List running services.
- **Example Output**:
  ```
  Creating network "myapp_default" with the default driver
  Creating myapp_web_1 ... done
  Creating myapp_db_1  ... done
  ```

#### Setting Up a FastAPI + PostgreSQL Multi-container Project
- **Files**:
  - `docker-compose.yml`:
    ```yaml
    version: '3.8'
    services:
      app:
        build: .
        ports:
          - "8000:8000"
        depends_on:
          - db
        environment:
          DATABASE_URL: postgresql://user:pass@db:5432/mydb
      db:
        image: postgres:13
        volumes:
          - db-data:/var/lib/postgresql/data
        environment:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
          POSTGRES_DB: mydb
    volumes:
      db-data:
    ```
  - `Dockerfile`:
    ```dockerfile
    FROM python:3.9-slim
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install -r requirements.txt
    COPY . .
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```
  - `requirements.txt`: `fastapi uvicorn psycopg2-binary`.
  - `main.py`:
    ```python
    from fastapi import FastAPI
    import os
    app = FastAPI()
    @app.get("/")
    def read_root():
        return {"db": os.getenv("DATABASE_URL")}
    ```
- **Run**: `docker-compose up -d`.
- **Test**: `curl http://localhost:8000`.

---

### ✅ Docker Image Optimization

#### Reduce Image Size
- **`.dockerignore`**:
  - Exclude unnecessary files (e.g., `.git`, `node_modules`):
    ```text
    .git
    *.md
    __pycache__
    ```
- **Multi-stage Builds**:
  - Use multiple `FROM` stages to separate build and runtime:
    ```dockerfile
    # Build stage
    FROM python:3.9-slim AS builder
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --user -r requirements.txt

    # Runtime stage
    FROM python:3.9-slim
    WORKDIR /app
    COPY --from=builder /root/.local /root/.local
    COPY . .
    CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
    ```
  - Result: Smaller final image (excludes build tools).

#### Difference Between `CMD` vs. `ENTRYPOINT`
- **CMD**: Specifies default command/args, overridable at runtime.
  - Example: `CMD ["python", "app.py"]` → `docker run myapp python other.py` runs `other.py`.
- **ENTRYPOINT**: Sets the main executable, not easily overridden.
  - Example: `ENTRYPOINT ["uvicorn", "main:app"]` → Args passed append (e.g., `docker run myapp --port 8080`).
- **Combo**: Use both for flexibility:
  ```dockerfile
  ENTRYPOINT ["uvicorn", "main:app"]
  CMD ["--host", "0.0.0.0", "--port", "8000"]
  ```

#### Best Practices for Efficient Dockerfiles
- **Minimize Layers**: Combine `RUN` commands with `&&`:
  ```dockerfile
  RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*
  ```
- **Use Specific Tags**: `FROM python:3.9.18-slim` (not just `latest`).
- **Remove Temp Files**: Clean up in the same layer (e.g., `rm -rf /tmp/*`).
- **Order Matters**: Place least-changing instructions (e.g., `FROM`, `RUN apt`) first.

---

### ✅ Environment Variables & Secrets Management

#### Using `ENV` in Dockerfile
- **Purpose**: Hardcode environment variables in the image.
- **Example**:
  ```dockerfile
  ENV APP_ENV=production
  ENV PORT=8000
  ```
- **Access**: Available in container (e.g., `os.getenv("APP_ENV")`).

#### `.env` Files with Docker Compose
- **Setup**:
  - `.env`:
    ```text
    DB_USER=user
    DB_PASS=pass
    ```
  - `docker-compose.yml`:
    ```yaml
    services:
      app:
        environment:
          - DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@db/mydb
    ```
- **Run**: `docker-compose up` (loads `.env` automatically).

#### Managing Secrets Securely
- **Docker Secrets** (Swarm mode): Store in `/run/secrets/`.
  - Example (Compose emulation):
    ```yaml
    services:
      app:
        secrets:
          - db_password
    secrets:
      db_password:
        file: ./db_pass.txt
    ```
  - Access: `/run/secrets/db_password` in container.
- **Best Practice**: Avoid hardcoding secrets; use runtime injection or secret stores (e.g., AWS Secrets Manager).

---

### ✅ Container Orchestration: Intro to Kubernetes

#### What is Kubernetes? Why Use It Over Docker Compose?
- **Definition**: An open-source system for automating deployment, scaling, and management of containerized apps.
- **Why Use It?**
  - **Scalability**: Manages thousands of containers across clusters.
  - **Resilience**: Auto-restarts failed containers, load balances traffic.
  - **Portability**: Runs on any cloud or on-premises.
- **Compose vs. Kubernetes**:
  - Compose: Single-host, simple, dev-focused.
  - Kubernetes: Multi-host, complex, production-ready.

#### Deploying a Simple App on Kubernetes (Minikube)
- **Setup Minikube**:
  - Install: `minikube start` (local Kubernetes cluster).
  - Verify: `kubectl get nodes`.
- **Deploy FastAPI**:
  - `deployment.yaml`:
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: fastapi-app
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
            image: my-fastapi:latest
            ports:
            - containerPort: 8000
    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: fastapi-service
    spec:
      ports:
      - port: 80
        targetPort: 8000
      selector:
        app: fastapi
      type: LoadBalancer
    ```
  - Build: `docker build -t my-fastapi .`.
  - Apply: `kubectl apply -f deployment.yaml`.
  - Access: `minikube service fastapi-service --url`.

---

### ✅ Debugging & Troubleshooting

#### Logs (`docker logs <container_id>`)
- **Purpose**: View container output.
- **Examples**:
  - `docker logs -f myapp`: Follow live logs.
  - `docker logs --tail 10 myapp`: Last 10 lines.

#### Inspecting Containers
- **`docker inspect <container_id>`**: Full config (e.g., IP, mounts).
- **`docker exec -it <container_id> bash`**: Open a shell inside.
  - No bash? Use `sh`: `docker exec -it <container_id> sh`.

#### Common Issues and Fixes
- **Port Conflict**: `Error: port is already allocated`.
  - Fix: Change host port (e.g., `-p 8080:80`).
- **Image Pull Fails**: Check network or login: `docker login`.
- **Container Exits**: Check logs; ensure CMD runs a foreground process.

---

### ✅ Hands-on Projects

#### Project 1: FastAPI + PostgreSQL + Redis Using Docker Compose
- **Files**:
  - `docker-compose.yml`:
    ```yaml
    version: '3.8'
    services:
      app:
        build: .
        ports:
          - "8000:8000"
        depends_on:
          - db
          - cache
      db:
        image: postgres:13
        volumes:
          - db-data:/var/lib/postgresql/data
        environment:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
          POSTGRES_DB: mydb
      cache:
        image: redis:6
        volumes:
          - redis-data:/data
    volumes:
      db-data:
      redis-data:
    ```
  - `main.py`:
    ```python
    from fastapi import FastAPI
    import redis
    app = FastAPI()
    r = redis.Redis(host='cache', port=6379, db=0)
    @app.get("/")
    def read_root():
        count = r.incr("visits")
        return {"visits": count}
    ```
  - `requirements.txt`: `fastapi uvicorn redis`.
- **Run**: `docker-compose up -d`.

#### Project 2: Optimize Dockerfile & Reduce Image Size
- **Optimized Dockerfile**:
  ```dockerfile
  FROM python:3.9-slim AS builder
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --user -r requirements.txt

  FROM python:3.9-slim
  WORKDIR /app
  ENV PATH="/root/.local/bin:$PATH"
  COPY --from=builder /root/.local /root/.local
  COPY main.py .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
  ```
- **Build**: `docker build -t fastapi-optimized .`.
- **Compare**: `docker images | grep fastapi` (smaller than single-stage).

---

## Additional Tips
- **Compose Overrides**: Use `docker-compose.override.yml` for dev-specific configs.
- **Healthchecks**: Add to `docker-compose.yml`:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000"]
    interval: 30s
  ```

---

These notes provide a thorough intermediate foundation for Docker. Practice the projects to master multi-container apps and optimization, and let me know if you’d like more depth!

I assume you meant "intermediate Docker topics" since your last request was about **Intermediate: Docker in Development & Production**. However, if you intended to ask about advanced Docker topics, please clarify, and I’ll pivot accordingly! For now, I’ll expand on the intermediate topics with additional concepts, techniques, and details that deepen your understanding while staying within the intermediate scope—bridging to advanced usage without overwhelming you. These additions enhance the previous notes with more practical tools, edge cases, and insights.

---

# Intermediate: Docker in Development & Production (Expanded)

---

## ✅ Multi-container Applications: Docker Compose (Expanded)

### Advanced Docker Compose Features
- **Profiles**: Run specific services for different scenarios.
  - Example:
    ```yaml
    version: '3.8'
    services:
      app:
        build: .
        profiles: ["web"]
      worker:
        build: .
        command: celery -A tasks worker
        profiles: ["worker"]
    ```
  - Run: `docker-compose --profile worker up` (only starts `worker`).
- **Extends**: Reuse service definitions across files.
  - `base.yml`:
    ```yaml
    services:
      app:
        build: .
        ports:
          - "8000:8000"
    ```
  - `docker-compose.yml`:
    ```yaml
    services:
      app:
        extends:
          file: base.yml
          service: app
        environment:
          - ENV=prod
    ```
- **Scaling**: Run multiple instances of a service.
  - `docker-compose up -d --scale app=3` (3 `app` containers).

### Networking in Docker Compose
- **Custom Networks**:
  ```yaml
  version: '3.8'
  services:
    app:
      networks:
        - frontend
    db:
      networks:
        - backend
  networks:
    frontend:
    backend:
  ```
  - Isolates `app` and `db` communication.
- **Aliases**: Assign custom names within a network.
  ```yaml
  services:
    app:
      networks:
        frontend:
          aliases:
            - webapp
  ```

### Compose for Development
- **Hot Reloading**:
  - FastAPI example with volume for code changes:
    ```yaml
    services:
      app:
        build: .
        volumes:
          - .:/app
        command: uvicorn main:app --host 0.0.0.0 --reload
    ```

---

## ✅ Docker Image Optimization (Expanded)

### Advanced Multi-stage Builds
- **Copy Specific Files**:
  ```dockerfile
  FROM node:16 AS builder
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN npm install
  COPY src ./src
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  ```
  - Only `dist` is copied, reducing final size.

### RUN Command Optimization
- **Chaining with Cleanup**:
  ```dockerfile
  RUN apt-get update && apt-get install -y \
      build-essential \
      && rm -rf /var/lib/apt/lists/*
  ```
  - Removes apt cache in the same layer.
- **Non-root User**:
  ```dockerfile
  RUN useradd -m appuser
  USER appuser
  ```

### Image Pruning and Analysis
- **Prune Unused Images**: `docker image prune -a` (removes all untagged).
- **Dive**: Analyze layers for size:
  ```bash
  docker run -ti --rm -v /var/run/docker.sock:/var/run/docker.sock wagoodman/dive myapp
  ```

---

## ✅ Environment Variables & Secrets Management (Expanded)

### Dynamic Environment Substitution
- **Compose with `.env`**:
  - `.env`:
    ```text
    TAG=latest
    ```
  - `docker-compose.yml`:
    ```yaml
    services:
      app:
        image: myapp:${TAG}
    ```
- **Runtime Override**: `TAG=v1.0 docker-compose up`.

### Secrets Beyond Files
- **Pass Secrets at Runtime**:
  ```bash
  docker run --env-file secrets.env myapp
  ```
  - `secrets.env`: `API_KEY=xyz123`.
- **Docker Secrets in Compose** (Non-Swarm):
  - Simulate with volumes:
    ```yaml
    services:
      app:
        volumes:
          - ./secrets/api_key.txt:/run/secrets/api_key:ro
    ```

### Best Practices
- **Avoid Sensitive ENV**: Use secrets for production credentials.
- **Layered Config**: Combine `ENV` (defaults), `.env` (dev), and runtime vars (prod).

---

## ✅ Container Orchestration: Intro to Kubernetes (Expanded)

### Kubernetes Concepts for Beginners
- **Pods**: Smallest deployable unit (one or more containers).
- **Deployments**: Manage pod replicas and updates.
- **Services**: Expose pods to network (e.g., LoadBalancer).
- **ConfigMaps**: Store non-sensitive config data.

### Minikube Enhancements
- **Dashboard**: `minikube dashboard` (visualize cluster).
- **Local Registry**: Build images directly into Minikube:
  ```bash
  eval $(minikube docker-env)
  docker build -t myapp .
  ```
- **Resource Limits**:
  ```yaml
  spec:
    containers:
    - name: fastapi
      resources:
        limits:
          cpu: "0.5"
          memory: "512Mi"
  ```

### K3s Alternative
- **Why K3s?**: Lightweight Kubernetes for learning/production.
- **Install**: `curl -sfL https://get.k3s.io | sh -`.
- **Deploy**: Same YAML as Minikube, use `kubectl`.

---

## ✅ Debugging & Troubleshooting (Expanded)

### Advanced Logging
- **JSON Logs**: Configure Docker to parse logs:
  ```json
  # /etc/docker/daemon.json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }
  ```
- **Filter Logs**: `docker logs myapp --since 10m` (last 10 mins).

### Container Internals
- **Network Debugging**:
  - `docker network inspect <network>`: Check IPs, connected containers.
  - `docker exec myapp ping db`: Test connectivity.
- **Resource Usage**: `docker stats myapp` (live CPU/memory).

### Common Issues (More Fixes)
- **OOM Killed**: Container exceeds memory:
  - Fix: Increase limit (`--memory`) or optimize app.
- **Permission Denied**: Volume ownership mismatch:
  - Fix: `docker run --user $(id -u):$(id -g)`.
- **ENTRYPOINT Fails**: Check syntax (JSON vs. shell form).

---

## ✅ Hands-on Projects (Expanded)

### Project 1: FastAPI + PostgreSQL + Redis (Enhanced)
- **Add Worker**:
  - `tasks.py`:
    ```python
    from celery import Celery
    app = Celery('tasks', broker='redis://cache:6379/0')
    @app.task
    def log_visit():
        print("Visit logged")
    ```
  - `main.py`: Add `log_visit.delay()`.
  - `docker-compose.yml`:
    ```yaml
    services:
      worker:
        build: .
        command: celery -A tasks worker --loglevel=info
        depends_on:
          - cache
    ```
- **Run**: `docker-compose up -d --scale worker=2`.

### Project 2: Optimized Dockerfile with Healthcheck
- **Enhanced Dockerfile**:
  ```dockerfile
  FROM python:3.9-slim AS builder
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --user -r requirements.txt

  FROM python:3.9-slim
  WORKDIR /app
  COPY --from=builder /root/.local /root/.local
  COPY . .
  ENV PATH="/root/.local/bin:$PATH"
  HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/ || exit 1
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
  ```
- **Verify**: `docker run -d -p 8000:8000 fastapi-optimized` → `docker ps` shows `healthy`.

### Bonus Project: Multi-service Debugging
- Add a failing service to Compose, debug with logs and `exec`:
  ```yaml
  services:
    buggy:
      image: busybox
      command: sh -c "sleep 5 && exit 1"
  ```

---

## Additional Intermediate Concepts

### Docker BuildKit
- **Enable**: `DOCKER_BUILDKIT=1 docker build .`.
- **Benefits**: Faster builds, better caching, parallel steps.

### Docker Context
- **Manage Multiple Hosts**:
  - `docker context create remote --docker "host=ssh://user@remote"`.
  - `docker context use remote` → Build/run on remote machine.

### Compose File Versions
- **Versioning**: Use `3.8` for modern features (e.g., healthchecks); avoid `2.x` for new projects.

---

These expanded notes deepen your intermediate Docker skills with advanced Compose features, optimization tricks, and practical debugging. Practice these in your projects to solidify your knowledge. Let me know if you’d like to explore advanced topics next or refine anything here!