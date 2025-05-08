### ✅ **6. Infrastructure as Code (IaC) Security**  
- IaC Basics (Terraform, Ansible)  
- Scanning IaC for Vulnerabilities (`Checkov`, `TFSec`)  
- Secure IaC Best Practices (Least Privilege, Policy as Code)

---

#### IaC Basics (Terraform, Ansible)
##### What is Infrastructure as Code (IaC)?
- **Definition**: IaC is the practice of managing and provisioning infrastructure using machine-readable configuration files rather than manual processes.
- **Benefits**: Consistency, repeatability, version control, and automation.
- **Security Relevance**: Misconfigurations in IaC can lead to vulnerabilities (e.g., exposed ports, overly permissive permissions).

##### Terraform
- **Overview**: An open-source IaC tool by HashiCorp for defining and provisioning infrastructure across multiple cloud providers (e.g., AWS, Azure, GCP).
- **Key Concepts**:
  - **Providers**: Plugins for cloud platforms (e.g., `aws`, `azurerm`).
  - **Resources**: Infrastructure components (e.g., EC2 instance, S3 bucket).
  - **State**: Tracks the current infrastructure (`terraform.tfstate`).
  - **Modules**: Reusable configurations.
- **Basic Example** (AWS EC2 instance):
  ```hcl
  provider "aws" {
    region = "us-east-1"
  }
  resource "aws_instance" "example" {
    ami           = "ami-0c55b159cbfafe1f0"
    instance_type = "t2.micro"
    tags = {
      Name = "MyInstance"
    }
  }
  ```
- **Workflow**:
  1. Write: Define infrastructure in `.tf` files.
  2. Init: `terraform init` (downloads providers).
  3. Plan: `terraform plan` (preview changes).
  4. Apply: `terraform apply` (provisions resources).
- **Security Considerations**:
  - Avoid hardcoding secrets (e.g., access keys) in `.tf` files.
  - Use variables or a secrets manager (e.g., AWS Secrets Manager).

##### Ansible
- **Overview**: An open-source configuration management tool for automating infrastructure setup and application deployment.
- **Key Concepts**:
  - **Playbooks**: YAML files defining tasks.
  - **Inventory**: List of target hosts.
  - **Modules**: Reusable units of work (e.g., `apt`, `file`).
- **Basic Example** (Install Nginx):
  ```yaml
  - name: Setup web server
    hosts: webservers
    become: yes
    tasks:
      - name: Install Nginx
        apt:
          name: nginx
          state: present
      - name: Start Nginx
        service:
          name: nginx
          state: started
  ```
- **Workflow**:
  1. Write: Create playbooks and inventory.
  2. Run: `ansible-playbook playbook.yml -i inventory`.
- **Security Considerations**:
  - Use encrypted variables (Ansible Vault) for secrets.
  - Limit SSH access to specific keys/users.

##### Terraform vs Ansible
| **Aspect**      | **Terraform**             | **Ansible**              |
|-----------------|---------------------------|--------------------------|
| **Purpose**     | Provisioning              | Configuration Management |
| **State**       | Maintains state file      | Stateless                |
| **Syntax**      | HCL (HashiCorp Language)  | YAML                     |
| **Execution**   | Declarative               | Procedural               |

---

#### Scanning IaC for Vulnerabilities (Checkov, TFSec)
##### Why Scan IaC?
- IaC defines infrastructure, and misconfigurations (e.g., public S3 buckets, no encryption) can introduce security risks.
- Scanning ensures compliance and security before deployment.

##### Checkov
- **Overview**: An open-source static analysis tool for scanning IaC files (Terraform, CloudFormation, Kubernetes, etc.).
- **Features**:
  - Detects misconfigurations (e.g., open ports, missing encryption).
  - Supports custom policies.
  - Integrates with CI/CD.
- **Usage**:
  ```bash
  pip install checkov
  checkov -d .
  ```
  - Output: "Check: CKV_AWS_18: Ensure S3 bucket has versioning enabled."
- **CI/CD Integration** (GitHub Actions):
  ```yaml
  name: Checkov Scan
  on: [push]
  jobs:
    scan:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Run Checkov
          run: |
            pip install checkov
            checkov -d . --soft-fail
  ```
- **Example Finding**:
  - Terraform: `aws_s3_bucket` without `server_side_encryption_configuration`.
- **Best Practice**: Fail builds on critical issues (`--hard-fail-on`).

##### TFSec
- **Overview**: A Terraform-specific security scanner focused on cloud provider best practices.
- **Features**:
  - Lightweight and fast.
  - AWS, Azure, GCP-specific checks.
  - Custom rule support.
- **Usage**:
  ```bash
  tfsec .
  ```
  - Output: "Problem: aws-s3-enable-bucket-encryption - S3 bucket does not enforce encryption."
- **CI/CD Integration** (GitLab CI):
  ```yaml
  tfsec_scan:
    stage: test
    script:
      - tfsec . --no-colour
    allow_failure: true
  ```
- **Example Finding**:
  - Terraform: `aws_security_group` with `ingress { cidr_blocks = ["0.0.0.0/0"] }`.
- **Best Practice**: Use `--exclude` to ignore false positives or legacy code.

##### Comparison
| **Tool**   | **Scope**            | **Ease of Use** | **Customization** |
|------------|----------------------|-----------------|-------------------|
| **Checkov**| Multi-IaC (TF, K8s)  | High            | High (Policies)   |
| **TFSec**  | Terraform-only       | Very High       | Moderate          |

---

#### Secure IaC Best Practices (Least Privilege, Policy as Code)
##### Least Privilege
- **Definition**: Grant only the minimum permissions necessary for a resource or user to function.
- **Why It Matters**: Reduces blast radius if credentials are compromised.
- **Implementation**:
  - **Terraform (AWS IAM)**:
    ```hcl
    resource "aws_iam_role" "ec2_role" {
      name = "ec2-minimal-role"
      assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [{
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = { Service = "ec2.amazonaws.com" }
        }]
      })
    }
    resource "aws_iam_role_policy" "ec2_policy" {
      role = aws_iam_role.ec2_role.id
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [{
          Effect = "Allow"
          Action = ["s3:GetObject"]
          Resource = "arn:aws:s3:::my-bucket/*"
        }]
      })
    }
    ```
  - **Ansible**: Limit SSH user privileges in `ansible.cfg`:
    ```ini
    [privilege_escalation]
    become_user = restricted_user
    ```
- **Best Practices**:
  - Avoid broad permissions (e.g., `"*"` in IAM).
  - Use IAM Access Analyzer or equivalent to audit permissions.

##### Policy as Code
- **Definition**: Defining security and compliance policies as code, enforced automatically during provisioning.
- **Tools**:
  - **Open Policy Agent (OPA)**: A general-purpose policy engine.
  - **Sentinel**: HashiCorp’s policy-as-code for Terraform.
- **OPA Example** (Deny public S3 buckets):
  ```rego
  package terraform.analysis
  import input as tfplan
  deny[msg] {
    resource = tfplan.resource_changes[_]
    resource.type == "aws_s3_bucket"
    not resource.change.after.server_side_encryption_configuration
    msg = sprintf("S3 bucket '%s' must have encryption enabled", [resource.change.after.bucket])
  }
  ```
  - Usage: `opa eval -i plan.json -d policy.rego`.
- **Sentinel Example** (Terraform Cloud):
  ```sentinel
  import "tfplan"
  main = rule {
    all tfplan.resources.aws_s3_bucket as bucket {
      bucket.server_side_encryption_configuration is present
    }
  }
  ```
- **Best Practices**:
  - Version control policies alongside IaC.
  - Test policies in staging before enforcing.

##### Additional Secure IaC Practices
1. **Secrets Management**:
   - Use Terraform with Vault:
     ```hcl
     provider "vault" {}
     data "vault_generic_secret" "db_creds" {
       path = "secret/db"
     }
     resource "aws_db_instance" "db" {
       username = data.vault_generic_secret.db_creds.data["username"]
       password = data.vault_generic_secret.db_creds.data["password"]
     }
     ```
2. **Immutable Infrastructure**:
   - Avoid in-place changes; redeploy with updated IaC.
3. **Versioning**:
   - Tag Terraform modules (e.g., `module "vpc" { source = "git::https://github.com/org/vpc?ref=v1.0.0" }`).
4. **Audit Trails**:
   - Track changes with Git and Terraform state diffs.

---

### Practical Workflow
1. **Define IaC**: Write Terraform/Ansible configs with least privilege.
2. **Scan**: Run Checkov/TFSec in CI to catch vulnerabilities.
3. **Enforce Policies**: Use OPA to block non-compliant deployments.
4. **Deploy**: Apply IaC with `terraform apply` or `ansible-playbook`.

---

These notes provide a comprehensive foundation for securing Infrastructure as Code in a DevSecOps context. Let me know if you’d like deeper examples (e.g., a full Terraform module) or integration with previous MkDocs navigation!