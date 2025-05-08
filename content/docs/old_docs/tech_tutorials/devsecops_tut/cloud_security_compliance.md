### ✅ **4. Cloud Security & Compliance**  
- AWS, Azure, GCP Security Basics  
- Identity & Access Management (IAM, Roles, Policies)  
- Cloud Security Monitoring (`AWS Security Hub`, `Azure Security Center`)  
- Compliance Standards (ISO 27001, SOC2, GDPR, NIST)  

---

#### AWS, Azure, GCP Security Basics
##### AWS Security Basics
- **Overview**: Amazon Web Services (AWS) provides a shared responsibility model—AWS secures the cloud infrastructure, while users secure their data and applications.
- **Key Services**:
  - **EC2**: Secure instances with Security Groups (firewalls) and key pairs.
  - **S3**: Encrypt buckets (e.g., AES-256) and restrict access with bucket policies.
  - **VPC**: Isolate resources with subnets, route tables, and Network ACLs.
- **Security Features**:
  - **AWS Shield**: DDoS protection.
  - **AWS WAF**: Web application firewall for filtering traffic.
  - **KMS**: Key Management Service for encryption.
- **Best Practices**:
  - Enable MFA for root and IAM users.
  - Use VPC peering and private subnets for sensitive workloads.
  - Regularly rotate access keys and credentials.
- **Example**: Secure an S3 bucket:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::my-bucket/*",
        "Condition": {
          "Bool": {
            "aws:SecureTransport": "false"
          }
        }
      }
    ]
  }
  ```

##### Azure Security Basics
- **Overview**: Microsoft Azure emphasizes identity-driven security and integrated tools for cloud workloads.
- **Key Services**:
  - **Virtual Machines**: Use Network Security Groups (NSGs) for traffic control.
  - **Blob Storage**: Encrypt with Azure Key Vault and restrict via RBAC.
  - **Virtual Network**: Segment with VNets and subnets.
- **Security Features**:
  - **Azure DDoS Protection**: Mitigates volumetric attacks.
  - **Azure Firewall**: Stateful filtering for VNets.
  - **Key Vault**: Manages secrets and keys.
- **Best Practices**:
  - Enable Azure AD Conditional Access for dynamic policies.
  - Use Managed Identities instead of static credentials.
  - Lock down public endpoints with Private Link.
- **Example**: NSG rule to allow SSH:
  ```json
  {
    "name": "AllowSSH",
    "properties": {
      "protocol": "TCP",
      "sourcePortRange": "*",
      "destinationPortRange": "22",
      "sourceAddressPrefix": "10.0.0.0/24",
      "destinationAddressPrefix": "*",
      "access": "Allow",
      "priority": 100,
      "direction": "Inbound"
    }
  }
  ```

##### GCP Security Basics
- **Overview**: Google Cloud Platform (GCP) leverages Google’s infrastructure with a focus on simplicity and automation.
- **Key Services**:
  - **Compute Engine**: Secure VMs with firewall rules and IAM.
  - **Cloud Storage**: Encrypt objects and use signed URLs for access.
  - **VPC**: Use firewall rules and VPC Service Controls.
- **Security Features**:
  - **Cloud Armor**: Protects against web attacks.
  - **Secret Manager**: Stores sensitive data.
  - **Shielded VMs**: Ensures VM integrity.
- **Best Practices**:
  - Use Organization Policies to enforce constraints (e.g., no public IPs).
  - Enable VPC Flow Logs for network monitoring.
  - Leverage Google’s default encryption at rest.
- **Example**: Firewall rule to allow HTTP:
  ```bash
  gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags web-server
  ```

##### Comparison
| **Provider** | **Strength**                  | **Key Security Tool**   |
|--------------|-------------------------------|-------------------------|
| **AWS**      | Broad service ecosystem       | KMS, Security Groups    |
| **Azure**    | Enterprise integration (AD)   | Azure AD, Key Vault     |
| **GCP**      | Simplicity, AI-driven security| Secret Manager, Armor   |

---

#### Identity & Access Management (IAM, Roles, Policies)
##### AWS IAM
- **Definition**: Manages users, groups, and permissions in AWS.
- **Components**:
  - **Users**: Individuals or applications.
  - **Groups**: Collections of users with shared permissions.
  - **Roles**: Temporary credentials for services/users.
  - **Policies**: JSON documents defining permissions.
- **Example Policy** (S3 read-only):
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:ListBucket"],
        "Resource": ["arn:aws:s3:::my-bucket/*", "arn:aws:s3:::my-bucket"]
      }
    ]
  }
  ```
- **Best Practices**:
  - Use roles for EC2/Lambda instead of access keys.
  - Enable MFA for all users.
  - Audit with AWS IAM Access Analyzer.

##### Azure IAM (Azure AD + RBAC)
- **Definition**: Combines Azure Active Directory (AAD) for identity and Role-Based Access Control (RBAC) for permissions.
- **Components**:
  - **AAD Users/Groups**: Identity management.
  - **Roles**: Predefined (e.g., Contributor) or custom.
  - **Scope**: Permissions at subscription, resource group, or resource level.
- **Example Custom Role**:
  ```json
  {
    "Name": "VM Reader",
    "IsCustom": true,
    "Description": "Read-only access to VMs",
    "Actions": ["Microsoft.Compute/virtualMachines/read"],
    "NotActions": [],
    "AssignableScopes": ["/subscriptions/<sub-id>"]
  }
  ```
- **Best Practices**:
  - Use Managed Identities for apps.
  - Apply Conditional Access (e.g., require MFA for admins).
  - Monitor with AAD Sign-in Logs.

##### GCP IAM
- **Definition**: Controls access to GCP resources with a hierarchical policy model.
- **Components**:
  - **Members**: Users, groups, service accounts.
  - **Roles**: Predefined (e.g., `roles/viewer`) or custom.
  - **Policies**: Bind members to roles at project/org level.
- **Example Binding**:
  ```bash
  gcloud projects add-iam-policy-binding my-project \
    --member="user:dev@example.com" \
    --role="roles/storage.objectViewer"
  ```
- **Best Practices**:
  - Use service accounts for workloads, not user accounts.
  - Limit `Owner` role usage.
  - Enable IAM Recommender for unused permissions.

---

#### Cloud Security Monitoring (AWS Security Hub, Azure Security Center)
##### AWS Security Hub
- **What is It?**: A centralized service for aggregating security findings and compliance checks across AWS accounts.
- **Features**:
  - Integrates with GuardDuty (threat detection), Inspector (vulnerability scanning), and Config (compliance).
  - Supports CIS AWS Foundations, PCI DSS benchmarks.
- **Usage**:
  1. Enable Security Hub in AWS Console.
  2. View findings: Misconfigured S3 buckets, exposed EC2 instances.
  3. Automate remediation with Lambda (e.g., fix public S3 buckets).
- **Example Finding**:
  ```json
  {
    "Title": "S3 Bucket Public Access",
    "Severity": "HIGH",
    "Resource": "arn:aws:s3:::my-bucket",
    "Recommendation": "Enable Block Public Access"
  }
  ```
- **DevSecOps Integration**: Feed findings into CI/CD for pre-deployment checks.

##### Azure Security Center (Now Microsoft Defender for Cloud)
- **What is It?**: A unified security management tool for Azure and hybrid environments.
- **Features**:
  - **Secure Score**: Quantifies security posture.
  - **Threat Protection**: Detects anomalies (e.g., brute-force attacks).
  - **Compliance**: Maps to standards like ISO 27001.
- **Usage**:
  1. Enable Defender for Cloud in Azure Portal.
  2. Review recommendations: Encrypt unencrypted disks, update VMs.
  3. Use Azure Policy for enforcement.
- **Example Recommendation**:
  - "Enable network security group on subnet X."
- **DevSecOps Integration**: Automate fixes with Azure Automation or GitHub Actions.

##### Comparison
| **Tool**            | **Focus**               | **Integration**         |
|---------------------|-------------------------|-------------------------|
| **AWS Security Hub**| Broad AWS coverage      | GuardDuty, Inspector    |
| **Azure Defender**  | Hybrid + Secure Score   | Azure Monitor, Policy   |

---

#### Compliance Standards (ISO 27001, SOC2, GDPR, NIST)
##### ISO 27001
- **Definition**: International standard for Information Security Management Systems (ISMS).
- **Key Requirements**:
  - Risk assessments and treatment plans.
  - Policies for access control, encryption, incident response.
- **Cloud Mapping**:
  - AWS: Use Config Rules for compliance checks.
  - Azure: Leverage Azure Blueprints.
- **DevSecOps**: Automate audits with IaC (e.g., Terraform).

##### SOC 2
- **Definition**: Service Organization Control 2, focused on security, availability, and privacy for service providers.
- **Key Controls**:
  - Trust Services Criteria (e.g., CC6.1 for logical access).
  - Annual audits by third parties.
- **Cloud Mapping**:
  - AWS: Security Hub + Artifact for SOC reports.
  - GCP: Use Assured Workloads for compliance.
- **DevSecOps**: Monitor logs (e.g., CloudTrail) for audit trails.

##### GDPR
- **Definition**: General Data Protection Regulation (EU) for data privacy.
- **Key Principles**:
  - Data minimization, consent, right to erasure.
  - Breach notification within 72 hours.
- **Cloud Mapping**:
  - AWS: Encrypt data with KMS, log access with CloudTrail.
  - Azure: Use Data Protection features in AAD.
- **DevSecOps**: Implement runtime monitoring (e.g., Falco) for breach detection.

##### NIST (800-53)
- **Definition**: U.S. framework for securing federal systems, widely adopted in private sectors.
- **Key Controls**:
  - Access control (AC), audit/accountability (AU), system protection (SC).
- **Cloud Mapping**:
  - AWS: Align with NIST via Security Hub.
  - GCP: Use Forseti Security for compliance.
- **DevSecOps**: Automate control enforcement with CI/CD checks.

---

### Practical Workflow
1. **Setup**: Configure IAM roles/policies in AWS/Azure/GCP.
2. **Secure Resources**: Apply encryption, network rules.
3. **Monitor**: Enable Security Hub/Defender for continuous checks.
4. **Compliance**: Map controls to ISO/SOC2 with automated audits.

---

These notes provide a thorough foundation for cloud security and compliance in a DevSecOps context. Let me know if you’d like deeper examples (e.g., a full IAM policy) or integration with previous MkDocs navigation!