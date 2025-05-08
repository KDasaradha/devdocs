### ✅ **10. Compliance & Governance in DevSecOps**  
- Implementing Security Standards (`SOC2`, `PCI-DSS`, `HIPAA`, `GDPR`)  
- Policy-as-Code (`Open Policy Agent`, `Conftest`)  
- Automated Compliance Checks (`AWS Config`, `Azure Policy`)  

---

#### Implementing Security Standards (SOC2, PCI-DSS, HIPAA, GDPR)
##### What is Compliance in DevSecOps?
- **Definition**: Ensuring that systems, processes, and practices align with regulatory and industry security standards through automated and repeatable mechanisms.
- **Purpose**: Mitigates legal, financial, and reputational risks while embedding security into development workflows.

##### SOC2 (Service Organization Control 2)
- **Overview**: A framework for service providers to demonstrate security, availability, and privacy controls, audited by third parties.
- **Key Trust Services Criteria**:
  - **Security**: Protect against unauthorized access (e.g., CC6.1 - Logical Access).
  - **Availability**: Ensure system uptime (e.g., CC7.1 - Monitoring).
- **Implementation**:
  - **Control**: Encrypt data at rest.
    ```hcl
    # Terraform: AWS S3 encryption
    resource "aws_s3_bucket" "soc2_compliant" {
      bucket = "my-soc2-bucket"
      server_side_encryption_configuration {
        rule {
          apply_server_side_encryption_by_default {
            sse_algorithm = "AES256"
          }
        }
      }
    }
    ```
  - **Logging**: Enable AWS CloudTrail for audit trails.
    ```bash
    aws cloudtrail create-trail --name my-trail --s3-bucket-name my-logs
    ```
- **DevSecOps Use**: Automate SOC2 checks in CI/CD (e.g., scan for unencrypted resources).

##### PCI-DSS (Payment Card Industry Data Security Standard)
- **Overview**: A standard for organizations handling credit card data, requiring 12 requirements (e.g., protect cardholder data, restrict access).
- **Key Requirements**:
  - **Req 3**: Protect stored cardholder data (encryption).
  - **Req 7**: Restrict access to need-to-know.
- **Implementation**:
  - **Encryption**: Use AWS KMS for card data.
    ```hcl
    resource "aws_kms_key" "pci_key" {
      description = "PCI-DSS encryption key"
      enable_key_rotation = true
    }
    ```
  - **Access**: Limit with IAM:
    ```json
    {
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "kms:Decrypt",
          "Resource": "arn:aws:kms:us-east-1:123456789012:key/pci-key",
          "Condition": {
            "StringEquals": { "aws:PrincipalTag/role": "pci-auditor" }
          }
        }
      ]
    }
    ```
- **DevSecOps Use**: Scan IaC with Checkov for PCI compliance:
  ```bash
  checkov -d . --framework pci_dss
  ```

##### HIPAA (Health Insurance Portability and Accountability Act)
- **Overview**: U.S. regulation for protecting healthcare data (PHI - Protected Health Information).
- **Key Requirements**:
  - **Safeguards**: Encrypt PHI (Technical Safeguard).
  - **Audit**: Log access to PHI (Audit Controls).
- **Implementation**:
  - **Encryption**: Use Azure Blob Storage with encryption.
    ```yaml
    # Azure ARM Template
    {
      "type": "Microsoft.Storage/storageAccounts",
      "properties": {
        "encryption": {
          "services": { "blob": { "enabled": true } },
          "keySource": "Microsoft.Storage"
        }
      }
    }
    ```
  - **Logging**: Enable Azure Monitor:
    ```bash
    az monitor diagnostic-settings create --resource <storage-id> --logs '[{"category": "StorageRead"}]'
    ```
- **DevSecOps Use**: Automate HIPAA logging in CI/CD with ELK integration.

##### GDPR (General Data Protection Regulation)
- **Overview**: EU regulation for data privacy, emphasizing consent, data minimization, and breach notification.
- **Key Principles**:
  - **Article 5**: Data must be processed securely.
  - **Article 33**: Notify breaches within 72 hours.
- **Implementation**:
  - **Encryption**: Use GCP Cloud Storage with CMEK (Customer-Managed Encryption Keys).
    ```bash
    gsutil kms encryption -k projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key gs://my-bucket
    ```
  - **Breach Detection**: Monitor with Falco:
    ```yaml
    - rule: Unauthorized file access
      desc: Detect PHI access
      condition: open_fd and fd.name contains "/phi/"
      output: "Unauthorized access to PHI (%fd.name)"
    ```
- **DevSecOps Use**: Automate breach alerts via Slack in CI/CD.

---

#### Policy-as-Code (Open Policy Agent, Conftest)
##### What is Policy-as-Code?
- **Definition**: Defining and enforcing security and compliance policies as code, integrated into development and deployment workflows.
- **Purpose**: Ensures consistent governance without manual oversight.

##### Open Policy Agent (OPA)
- **Overview**: An open-source policy engine for enforcing rules across IaC, Kubernetes, and APIs using Rego (policy language).
- **Features**:
  - Evaluates JSON/YAML against policies.
  - Extensible with custom rules.
- **Setup**:
  1. Install: `brew install opa`.
  2. Write a Policy:
     ```rego
     package aws_compliance
     deny[msg] {
       resource = input.resource_changes[_]
       resource.type == "aws_s3_bucket"
       not resource.change.after.server_side_encryption_configuration
       msg = sprintf("S3 bucket '%s' must be encrypted (SOC2 CC6.1)", [resource.change.after.bucket])
     }
     ```
  3. Test: `opa eval -i terraform-plan.json -d policy.rego`.
- **CI/CD Integration** (GitHub Actions):
  ```yaml
  - name: OPA Check
    run: |
      terraform plan -out=tfplan && terraform show -json tfplan > plan.json
      opa eval -i plan.json -d policy.rego --fail-defined
  ```
- **Best Practices**:
  - Version policies in Git.
  - Test policies in staging before enforcement.

##### Conftest
- **Overview**: A lightweight tool built on OPA for testing IaC files (e.g., Terraform, Kubernetes manifests).
- **Features**:
  - Simple CLI for policy validation.
  - Supports multiple formats (JSON, YAML).
- **Setup**:
  1. Install: `brew install conftest`.
  2. Write a Policy:
     ```rego
     package main
     deny[msg] {
       resource = input.resource_changes[_]
       resource.type == "aws_security_group_rule"
       resource.change.after.cidr_blocks[_] == "0.0.0.0/0"
       resource.change.after.to_port == 22
       msg = "Security group allows public SSH access (PCI-DSS Req 1)"
     }
     ```
  3. Test: `conftest test terraform-plan.json`.
- **CI/CD Integration** (GitLab CI):
  ```yaml
  conftest_check:
    stage: validate
    script:
      - terraform plan -out=tfplan && terraform show -json tfplan > plan.json
      - conftest test plan.json
  ```
- **Best Practices**:
  - Use with OPA for broader policy enforcement.
  - Fail builds on policy violations.

---

#### Automated Compliance Checks (AWS Config, Azure Policy)
##### AWS Config
- **Overview**: A service for assessing, auditing, and evaluating AWS resource configurations against compliance rules.
- **Features**:
  - Prebuilt and custom rules (e.g., check S3 encryption).
  - Tracks configuration changes over time.
- **Setup**:
  1. Enable AWS Config: Console or CLI (`aws configservice start-configuration-recorder`).
  2. Add a Rule:
     ```bash
     aws configservice put-config-rule --config-rule '{
       "ConfigRuleName": "s3-encryption",
       "Source": {"Owner": "AWS", "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"}
     }'
     ```
  3. View Compliance: AWS Config dashboard or CLI.
- **Example Output**: "Non-compliant: Bucket 'my-bucket' lacks encryption."
- **DevSecOps Use**: Trigger Lambda for remediation:
  ```python
  # Lambda: Enable S3 encryption
  import boto3
  def handler(event, context):
      s3 = boto3.client('s3')
      s3.put_bucket_encryption(Bucket='my-bucket', ServerSideEncryptionConfiguration={
          'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
      })
  ```

##### Azure Policy
- **Overview**: A service for enforcing compliance and governance across Azure resources.
- **Features**:
  - Built-in policies (e.g., enforce VM encryption).
  - Custom policies via JSON.
- **Setup**:
  1. Create a Policy:
     ```json
     {
       "properties": {
         "displayName": "Enforce Blob Encryption",
         "policyRule": {
           "if": {
             "allOf": [
               {"field": "type", "equals": "Microsoft.Storage/storageAccounts"},
               {"field": "Microsoft.Storage/storageAccounts/encryption.services.blob.enabled", "notEquals": "true"}
             ]
           },
           "then": {"effect": "deny"}
         }
       }
     }
     ```
  2. Assign: Apply to a subscription/resource group via Azure Portal or CLI.
  3. Monitor: Compliance status in Azure Policy dashboard.
- **DevSecOps Use**: Integrate with CI/CD to deny non-compliant deployments:
  ```bash
  az policy state list --resource-group my-rg
  ```

##### Comparison
| **Tool**      | **Scope**         | **Strength**            |
|---------------|-------------------|-------------------------|
| **AWS Config**| AWS resources     | Change tracking         |
| **Azure Policy**| Azure resources   | Policy enforcement      |

---

### Practical Workflow
1. **Standards**:
   - Map SOC2/PCI-DSS controls to IaC (e.g., Terraform encryption).
   - Log GDPR/HIPAA events with SIEM.
2. **Policy-as-Code**:
   - Write OPA policies for compliance (e.g., no public SSH).
   - Test with Conftest in CI/CD.
3. **Automated Checks**:
   - Deploy AWS Config rules for continuous monitoring.
   - Enforce Azure Policy in deployment pipelines.

---

These notes provide a comprehensive foundation for compliance and governance in a DevSecOps context at an expert level. Let me know if you’d like deeper examples (e.g., a full OPA policy) or integration with previous MkDocs navigation!