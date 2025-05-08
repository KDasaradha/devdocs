### ✅ **2. CI/CD Pipeline Security**  
- Jenkins, GitHub Actions, GitLab CI/CD  
- Secrets Management in CI/CD (Vault, AWS Secrets Manager)  
- Code Scanning (SAST & DAST) 
 
---

#### Jenkins, GitHub Actions, GitLab CI/CD
##### Jenkins
- **What is Jenkins?**: An open-source automation server for building, testing, and deploying software, widely used for CI/CD pipelines.
- **Core Features**:
  - **Pipelines**: Defined via `Jenkinsfile` (scripted or declarative syntax).
  - **Plugins**: Extends functionality (e.g., Git, Docker, security tools).
  - **Nodes/Agents**: Distributes workloads across machines.
- **Pipeline Example** (Declarative `Jenkinsfile`):
  ```groovy
  pipeline {
      agent any
      stages {
          stage('Build') {
              steps {
                  sh 'make build'
              }
          }
          stage('Test') {
              steps {
                  sh 'make test'
              }
          }
          stage('Deploy') {
              steps {
                  sh 'make deploy'
              }
          }
      }
  }
  ```
- **Security Considerations**:
  - **Authentication**: Use LDAP or SSO (e.g., Okta) for user access.
  - **Authorization**: Role-based access control (RBAC) via plugins like "Role Strategy".
  - **Script Security**: Restrict Groovy scripts to prevent malicious code execution.
  - **Network**: Run Jenkins behind a firewall, use HTTPS.
- **DevSecOps Integration**:
  - Add security stages (e.g., SAST with SonarQube):
    ```groovy
    stage('Security Scan') {
        steps {
            sh 'sonar-scanner'
        }
    }
    ```

##### GitHub Actions
- **What is GitHub Actions?**: A CI/CD and automation platform integrated into GitHub, using YAML workflows.
- **Core Concepts**:
  - **Workflows**: Defined in `.github/workflows/<name>.yml`.
  - **Events**: Trigger workflows (e.g., `push`, `pull_request`).
  - **Jobs**: Group of steps executed on a runner.
  - **Runners**: Hosted (GitHub-provided) or self-hosted machines.
- **Workflow Example**:
  ```yaml
  name: CI Pipeline
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Build
          run: npm install && npm build
        - name: Test
          run: npm test
  ```
- **Security Considerations**:
  - **Secrets**: Store in GitHub Secrets (Settings > Secrets), not in code.
  - **Runner Security**: Use GitHub-hosted runners or secure self-hosted ones.
  - **Dependencies**: Pin action versions (e.g., `actions/checkout@v3`) to avoid supply chain attacks.
- **DevSecOps Integration**:
  - Add CodeQL for security scanning:
    ```yaml
    - name: Security Scan
      uses: github/codeql-action/analyze@v2
    ```

##### GitLab CI/CD
- **What is GitLab CI/CD?**: A built-in CI/CD system in GitLab, configured via `.gitlab-ci.yml`.
- **Core Features**:
  - **Pipelines**: Series of stages (e.g., build, test, deploy).
  - **Runners**: GitLab Runner executes jobs (shared, specific, or self-hosted).
  - **Variables**: Store secrets or config (e.g., API keys).
- **Pipeline Example**:
  ```yaml
  stages:
    - build
    - test
    - deploy
  build_job:
    stage: build
    script:
      - make build
  test_job:
    stage: test
    script:
      - make test
  deploy_job:
    stage: deploy
    script:
      - make deploy
  ```
- **Security Considerations**:
  - **Access Control**: Restrict pipeline triggers to protected branches.
  - **Runner Isolation**: Use Docker executors to isolate jobs.
  - **Audit Logs**: Track pipeline execution for compliance.
- **DevSecOps Integration**:
  - Enable built-in SAST:
    ```yaml
    include:
      - template: Security/SAST.gitlab-ci.yml
    ```

##### Comparison
| **Tool**         | **Strengths**                          | **Security Features**                  |
|------------------|----------------------------------------|----------------------------------------|
| **Jenkins**      | Highly customizable, plugin ecosystem | Requires manual security config        |
| **GitHub Actions** | Tight GitHub integration, ease of use | Secrets mgmt, CodeQL integration       |
| **GitLab CI/CD** | All-in-one (CI/CD + security tools)   | Native SAST/DAST, runner isolation    |

---

#### Secrets Management in CI/CD
##### Why Secrets Management Matters
- **Risks**: Hardcoding secrets (e.g., API keys, passwords) in scripts or repos exposes them to leaks.
- **Goal**: Securely store, access, and rotate sensitive data in CI/CD pipelines.

##### HashiCorp Vault
- **What is Vault?**: A tool for managing secrets, encryption, and access control.
- **Key Features**:
  - **Dynamic Secrets**: Generates short-lived credentials (e.g., database passwords).
  - **Encryption**: Secures data at rest and in transit.
  - **Access Policies**: Fine-grained control via ACLs.
- **Setup**:
  1. Install Vault: `brew install vault` or Docker.
  2. Start server: `vault server -dev`.
  3. Store a secret: `vault kv put secret/my-api-key value=abc123`.
  4. Retrieve: `vault kv get secret/my-api-key`.
- **CI/CD Integration**:
  - Jenkins: Use Vault Plugin to fetch secrets:
    ```groovy
    withVault(configuration: [vaultUrl: 'http://vault:8200'], vaultSecrets: [[path: 'secret/my-api-key', secretValues: [[envVar: 'API_KEY', vaultKey: 'value']]]]) {
        sh 'echo $API_KEY'
    }
    ```
  - GitHub Actions: Use Vault Action:
    ```yaml
    - name: Fetch Secret
      uses: hashicorp/vault-action@v2
      with:
        url: ${{ secrets.VAULT_URL }}
        token: ${{ secrets.VAULT_TOKEN }}
        secrets: secret/my-api-key value | API_KEY
    ```
  - GitLab: Use Vault integration:
    ```yaml
    variables:
      VAULT_ADDR: "http://vault:8200"
    job:
      script:
        - vault login $VAULT_TOKEN
        - export API_KEY=$(vault kv get -field=value secret/my-api-key)
    ```
- **Best Practice**: Rotate secrets periodically (e.g., Vault’s lease system).

##### AWS Secrets Manager
- **What is AWS Secrets Manager?**: A cloud-native service for storing and retrieving secrets in AWS environments.
- **Key Features**:
  - **Integration**: Works seamlessly with AWS services (e.g., Lambda, ECS).
  - **Rotation**: Automates secret rotation (e.g., RDS credentials).
  - **Encryption**: Uses AWS KMS for security.
- **Setup**:
  1. Create a secret: AWS Console > Secrets Manager > Store a new secret (e.g., `my-api-key: abc123`).
  2. Retrieve via AWS CLI: `aws secretsmanager get-secret-value --secret-id my-api-key`.
- **CI/CD Integration**:
  - Jenkins: Use AWS Secrets Manager Plugin:
    ```groovy
    withAWS(region: 'us-east-1') {
        def secret = awsSecretsManager(secretId: 'my-api-key')
        sh "echo ${secret['my-api-key']}"
    }
    ```
  - GitHub Actions: Use AWS SDK:
    ```yaml
    - name: Get Secret
      run: |
        export API_KEY=$(aws secretsmanager get-secret-value --secret-id my-api-key --query SecretString --output text)
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    ```
  - GitLab: Use CI variables or AWS CLI:
    ```yaml
    job:
      script:
        - export API_KEY=$(aws secretsmanager get-secret-value --secret-id my-api-key --query SecretString --output text)
      variables:
        AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
    ```
- **Best Practice**: Use IAM roles with least privilege for secret access.

---

#### Code Scanning (SAST & DAST)
##### Static Application Security Testing (SAST)
- **Definition**: Analyzes source code or binaries for vulnerabilities without executing the application.
- **How It Works**: Scans code for patterns (e.g., unsafe functions like `strcpy`) or logic flaws.
- **Tools**:
  - **SonarQube**: Open-source, supports multiple languages.
  - **Checkmarx**: Enterprise-grade SAST.
  - **CodeQL**: GitHub’s SAST tool for deep code analysis.
- **Example (SonarQube in Jenkins)**:
  ```groovy
  stage('SAST') {
      steps {
          withSonarQubeEnv('SonarServer') {
              sh 'sonar-scanner -Dsonar.projectKey=my-app'
          }
      }
  }
  ```
- **Pros**: Early detection (shift-left), language-specific rules.
- **Cons**: False positives, no runtime context.

##### Dynamic Application Security Testing (DAST)
- **Definition**: Tests a running application by simulating external attacks (e.g., XSS, SQL injection).
- **How It Works**: Interacts with the app via HTTP requests, analyzing responses for vulnerabilities.
- **Tools**:
  - **OWASP ZAP**: Open-source, manual/automated scanning.
  - **Burp Suite**: Advanced tool for pen testing.
  - **GitLab DAST**: Built-in browser-based scanning.
- **Example (OWASP ZAP in GitLab)**:
  ```yaml
  include:
    - template: Security/DAST.gitlab-ci.yml
  dast:
    variables:
      DAST_WEBSITE: "http://my-app.com"
      DAST_FULL_SCAN_ENABLED: "true"
  ```
- **Pros**: Real-world attack simulation, runtime context.
- **Cons**: Requires a deployed app, slower than SAST.

##### SAST vs DAST
| **Aspect**       | **SAST**                  | **DAST**                  |
|------------------|---------------------------|---------------------------|
| **Timing**       | Pre-deployment (code)     | Post-deployment (running app) |
| **Approach**     | White-box (sees code)     | Black-box (no code access) |
| **Speed**        | Faster                    | Slower                    |
| **Coverage**     | Code-level issues         | Runtime vulnerabilities   |

##### DevSecOps Integration
- **Pipeline Example** (GitHub Actions):
  ```yaml
  name: Secure CI
  on: [push]
  jobs:
    security:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: SAST (CodeQL)
          uses: github/codeql-action/analyze@v2
        - name: Build & Deploy
          run: docker build -t my-app . && docker run -d -p 80:80 my-app
        - name: DAST (OWASP ZAP)
          uses: zaproxy/action-full-scan@v0.4.0
          with:
            target: 'http://localhost:80'
  ```
- **Best Practice**: Combine SAST (early) and DAST (late) for comprehensive coverage.

---

### Practical Workflow
1. **Setup**: Configure Jenkins/GitHub Actions/GitLab CI with a pipeline.
2. **Secrets**: Integrate Vault or AWS Secrets Manager to securely inject credentials.
3. **Scanning**: Add SAST (e.g., SonarQube) in the build stage and DAST (e.g., OWASP ZAP) after deployment.
4. **Validation**: Fail the pipeline if security checks don’t pass.

---

These notes provide a deep dive into securing CI/CD pipelines, managing secrets, and implementing code scanning in a DevSecOps context. Let me know if you’d like further examples (e.g., a full pipeline config) or integration with the MkDocs nav from the previous response!