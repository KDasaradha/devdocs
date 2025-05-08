### ✅ **7. Secrets Management & Zero Trust Security**  
- **Secrets Management**  
  - HashiCorp Vault, AWS Secrets Manager, Doppler  
- **Zero Trust Security Model**  
  - Principle of Least Privilege (PoLP)  
  - Network Microsegmentation 

---

#### Secrets Management
##### What is Secrets Management?
- **Definition**: The process of securely storing, managing, and accessing sensitive data such as API keys, passwords, certificates, and tokens.
- **Why It Matters**: Prevents exposure of secrets in codebases, logs, or CI/CD pipelines, reducing the risk of breaches.
- **Key Principles**:
  - Centralized storage.
  - Encrypted at rest and in transit.
  - Dynamic generation and rotation.

##### HashiCorp Vault
- **Overview**: An open-source tool for managing secrets, encryption, and access control across on-premises and cloud environments.
- **Features**:
  - **Dynamic Secrets**: Generates short-lived credentials (e.g., database passwords).
  - **Encryption as a Service**: Encrypts data without managing keys.
  - **Access Control**: Fine-grained policies.
- **Setup**:
  1. Install: `brew install vault` or Docker: `docker run -d -p 8200:8200 vault`.
  2. Start in dev mode: `vault server -dev`.
  3. Login: `vault login` (use root token from logs).
  4. Store a secret: `vault kv put secret/my-api-key value=abc123`.
  5. Retrieve: `vault kv get secret/my-api-key`.
- **Example (Dynamic AWS Credentials)**:
  ```bash
  vault secrets enable -path=aws aws
  vault write aws/config/root access_key=<AWS_ACCESS_KEY> secret_key=<AWS_SECRET_KEY>
  vault write aws/roles/my-role credential_type=iam_user
  vault read aws/creds/my-role
  ```
  - Output: Temporary AWS access key and secret key.
- **CI/CD Integration** (GitLab):
  ```yaml
  job:
    variables:
      VAULT_ADDR: "http://vault:8200"
    script:
      - vault login $VAULT_TOKEN
      - export API_KEY=$(vault kv get -field=value secret/my-api-key)
  ```
- **Best Practices**:
  - Use TTLs for dynamic secrets (e.g., 24h leases).
  - Enable audit logs for tracking access.

##### AWS Secrets Manager
- **Overview**: A cloud-native service for storing, retrieving, and rotating secrets in AWS environments.
- **Features**:
  - **Rotation**: Automates credential rotation (e.g., RDS passwords).
  - **Integration**: Works with AWS services (e.g., Lambda, ECS).
  - **Encryption**: Uses AWS KMS.
- **Setup**:
  1. Create a secret: AWS Console > Secrets Manager > Store new secret (e.g., `my-api-key: abc123`).
  2. Retrieve via CLI: `aws secretsmanager get-secret-value --secret-id my-api-key`.
- **Example (Lambda Rotation)**:
  ```json
  {
    "SecretId": "my-db-creds",
    "RotationRules": {
      "AutomaticallyAfterDays": 30
    }
  }
  ```
- **CI/CD Integration** (GitHub Actions):
  ```yaml
  - name: Fetch Secret
    run: |
      export API_KEY=$(aws secretsmanager get-secret-value --secret-id my-api-key --query SecretString --output text)
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  ```
- **Best Practices**:
  - Use IAM roles with minimal permissions to access secrets.
  - Enable automatic rotation for database credentials.

##### Doppler
- **Overview**: A modern secrets management platform designed for developer workflows, with a focus on simplicity and team collaboration.
- **Features**:
  - **Sync**: Integrates with CI/CD, Kubernetes, and cloud providers.
  - **CLI**: Easy secret injection into apps.
  - **Auditability**: Tracks who accessed what.
- **Setup**:
  1. Install CLI: `brew install dopplerhq/cli/doppler`.
  2. Authenticate: `doppler login`.
  3. Create a secret: `doppler secrets set MY_API_KEY=abc123`.
  4. Fetch: `doppler run -- echo $MY_API_KEY`.
- **CI/CD Integration** (Jenkins):
  ```groovy
  stage('Run with Doppler') {
    steps {
      sh 'doppler run -- npm start'
    }
  }
  ```
- **Best Practices**:
  - Use environment-specific configs (e.g., dev, prod).
  - Restrict access with role-based permissions.

##### Comparison
| **Tool**           | **Strength**               | **Use Case**             |
|--------------------|----------------------------|--------------------------|
| **Vault**          | Dynamic secrets, flexible | Multi-cloud, on-prem     |
| **AWS Secrets Mgr**| AWS-native, rotation       | AWS-centric workloads    |
| **Doppler**        | Developer-friendly         | Small teams, simplicity  |

---

#### Zero Trust Security Model
##### What is Zero Trust?
- **Definition**: A security model that assumes no entity (user, device, or service) is inherently trusted, even inside the network perimeter.
- **Core Principle**: "Never trust, always verify."
- **Why It Matters**: Traditional perimeter-based security fails in distributed, cloud-native environments.

##### Principle of Least Privilege (PoLP)
- **Definition**: Grant only the minimum permissions necessary for a user, service, or process to function.
- **Implementation**:
  - **AWS IAM**:
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["s3:GetObject"],
          "Resource": "arn:aws:s3:::my-bucket/*"
        }
      ]
    }
    ```
    - Limits access to specific S3 actions and resources.
  - **Kubernetes RBAC**:
    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: Role
    metadata:
      namespace: dev
      name: pod-reader
    rules:
    - apiGroups: [""]
      resources: ["pods"]
      verbs: ["get", "list"]
    ```
    - Restricts to read-only pod access in one namespace.
- **Best Practices**:
  - Regularly audit permissions (e.g., AWS IAM Access Analyzer).
  - Use temporary credentials (e.g., AWS STS AssumeRole).
  - Apply PoLP to CI/CD pipelines (e.g., restrict GitHub Action scopes).

##### Network Microsegmentation
- **Definition**: Dividing a network into isolated segments to limit lateral movement of attackers.
- **Why It Matters**: Reduces blast radius in breaches (e.g., a compromised app can’t access a database).
- **Implementation**:
  - **Kubernetes Network Policies**:
    ```yaml
    apiVersion: networking.k8s.io/v1
    kind: NetworkPolicy
    metadata:
      name: api-to-db
      namespace: prod
    spec:
      podSelector:
        matchLabels:
          app: database
      policyTypes:
      - Ingress
      ingress:
      - from:
        - podSelector:
            matchLabels:
              app: api
        ports:
        - protocol: TCP
          port: 3306
    ```
    - Allows only API pods to access the database on port 3306.
  - **AWS VPC**:
    - Use Security Groups and Network ACLs:
      ```hcl
      resource "aws_security_group" "web" {
        name = "web-sg"
        ingress {
          from_port   = 80
          to_port     = 80
          protocol    = "tcp"
          cidr_blocks = ["10.0.1.0/24"] # Only app subnet
        }
      }
      ```
    - Restricts traffic to specific subnets.
  - **Istio (Service Mesh)**:
    ```yaml
    apiVersion: networking.istio.io/v1alpha3
    kind: VirtualService
    metadata:
      name: api-to-db
    spec:
      hosts:
      - "db.prod.svc.cluster.local"
      http:
      - route:
        - destination:
            host: "db.prod.svc.cluster.local"
          match:
          - sourceLabels:
              app: api
    ```
    - Enforces service-to-service communication.
- **Best Practices**:
  - Default deny all traffic, then allow specific flows.
  - Use monitoring (e.g., VPC Flow Logs) to validate segmentation.
  - Test with penetration testing to ensure isolation.

##### Zero Trust in Practice
- **Steps**:
  1. **Identity Verification**: Require MFA and device health checks (e.g., Azure AD Conditional Access).
  2. **Least Privilege**: Apply granular IAM and RBAC.
  3. **Microsegmentation**: Isolate workloads with network policies.
  4. **Continuous Monitoring**: Use tools like Falco or AWS GuardDuty.
- **Example Workflow**:
  - A developer accesses a Kubernetes cluster:
    - Authenticates via SSO + MFA.
    - Uses a role with minimal pod read permissions.
    - Traffic is restricted to their app’s namespace.

---

### Practical Workflow
1. **Secrets**:
   - Store API keys in Vault/AWS Secrets Manager.
   - Inject into CI/CD with Doppler or CLI commands.
2. **Zero Trust**:
   - Define least-privilege IAM roles for cloud resources.
   - Apply network policies in Kubernetes to segment traffic.
3. **Validation**:
   - Scan IaC with Checkov for secrets exposure.
   - Test microsegmentation with network probes.

---

These notes provide a comprehensive foundation for secrets management and zero trust security in a DevSecOps context. Let me know if you’d like deeper examples (e.g., a full Vault setup) or integration with previous MkDocs navigation!