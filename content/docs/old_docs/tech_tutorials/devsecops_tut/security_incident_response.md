### ✅ **8. Security Incident Response & Monitoring**  
- **SIEM (Security Information & Event Management)**  
  - Tools: `Splunk`, `ELK Stack`, `Wazuh`  
- **Runtime Security Monitoring**  
  - Tools: `Falco`, `Sysdig Secure`  
- **Threat Intelligence & Detection**  
  - MITRE ATT&CK, `Suricata`, `YARA Rules`  

---

#### SIEM (Security Information & Event Management)
##### What is SIEM?
- **Definition**: Security Information and Event Management systems collect, aggregate, and analyze security data from various sources to detect, investigate, and respond to incidents.
- **Purpose**: Provides real-time visibility into security events, correlates logs, and enables incident response.
- **Key Capabilities**:
  - Log aggregation.
  - Threat detection (e.g., anomaly detection).
  - Incident investigation and reporting.

##### Tools
1. **Splunk**
   - **Overview**: A commercial SIEM platform known for its powerful search and visualization capabilities.
   - **Features**:
     - Indexes logs from any source (e.g., AWS CloudTrail, Kubernetes).
     - Custom dashboards and alerts.
     - Machine learning for anomaly detection (Splunk Enterprise Security).
   - **Setup**:
     1. Install: Download from Splunk’s website or use Docker: `docker run -d -p 8000:8000 splunk/splunk`.
     2. Add data: Forward logs via Splunk Forwarder or HTTP Event Collector.
     3. Search: `index=main sourcetype=access_log status=403` (find forbidden requests).
   - **Example Alert**: Trigger on multiple failed logins:
     ```spl
     index=security sourcetype=auth | stats count by user | where count > 5
     ```
   - **DevSecOps Use**: Integrate with CI/CD to monitor pipeline logs:
     ```bash
     splunk forwarder -input /var/log/jenkins.log
     ```

2. **ELK Stack (Elasticsearch, Logstash, Kibana)**
   - **Overview**: An open-source SIEM stack for log management and visualization.
   - **Components**:
     - **Elasticsearch**: Stores and indexes logs.
     - **Logstash**: Processes and forwards logs.
     - **Kibana**: Visualizes data.
   - **Setup**:
     1. Install: `docker-compose up` with ELK config.
     2. Configure Logstash:
        ```conf
        input { file { path => "/var/log/syslog" } }
        output { elasticsearch { hosts => ["localhost:9200"] } }
        ```
     3. Query in Kibana: `response:500` (find server errors).
   - **Example Dashboard**: Track failed SSH attempts over time.
   - **DevSecOps Use**: Monitor container logs:
     ```bash
     docker logs my-app | logstash -f logstash.conf
     ```

3. **Wazuh**
   - **Overview**: An open-source SIEM and XDR (Extended Detection and Response) platform with a focus on endpoint security.
   - **Features**:
     - File integrity monitoring (FIM).
     - Vulnerability detection.
     - Integrates with ELK for visualization.
   - **Setup**:
     1. Install: Deploy Wazuh manager and agents (e.g., `yum install wazuh-manager`).
     2. Configure agent: `/var/ossec/etc/ossec.conf`.
     3. View alerts: Kibana or Wazuh dashboard.
   - **Example Rule**: Detect unauthorized file changes:
     ```xml
     <rule id="100001" level="10">
       <if_sid>550</if_sid>
       <description>Critical file modified</description>
       <match>/etc/passwd</match>
     </rule>
     ```
   - **DevSecOps Use**: Monitor Kubernetes nodes with Wazuh agents.

##### Comparison
| **Tool**   | **Strength**             | **Use Case**             |
|------------|--------------------------|--------------------------|
| **Splunk** | Advanced analytics       | Enterprise environments  |
| **ELK**    | Open-source, flexible    | Cost-effective logging   |
| **Wazuh**  | Endpoint focus, FIM      | Security ops teams       |

---

#### Runtime Security Monitoring
##### What is Runtime Security Monitoring?
- **Definition**: Observing and protecting systems during execution to detect and respond to threats in real time.
- **Purpose**: Catches anomalies missed by static or pre-deployment checks (e.g., malicious processes, privilege escalation).

##### Tools
1. **Falco**
   - **Overview**: An open-source runtime security tool for containers and hosts, using eBPF or kernel modules.
   - **Features**:
     - Detects suspicious system calls (e.g., `execve`).
     - Customizable rules.
     - Alerts via stdout, Slack, etc.
   - **Setup**:
     1. Install: `helm install falco falco-charts/falco`.
     2. Custom Rule:
        ```yaml
        - rule: Detect shell in container
          desc: A shell was spawned in a container
          condition: container.id != host and proc.name = "bash"
          output: "Shell spawned in container (%container.name)"
          priority: WARNING
        ```
     3. Run: `falco -r rules.yaml`.
   - **Example Output**: "WARNING: Shell spawned in container (web-app-123)."
   - **DevSecOps Use**: Monitor Kubernetes clusters:
     ```bash
     kubectl logs -f -l app=falco
     ```

2. **Sysdig Secure**
   - **Overview**: A commercial runtime security platform with deep container and Kubernetes visibility.
   - **Features**:
     - Behavioral monitoring (e.g., anomaly detection).
     - Vulnerability scanning and policy enforcement.
     - Integrates with Falco rules.
   - **Setup**:
     1. Install agent: `curl -s https://download.sysdig.com/stable/install-agent | bash`.
     2. Configure policies in Sysdig UI.
   - **Example Policy**: Block unauthorized network connections.
   - **DevSecOps Use**: Enforce runtime policies in CI/CD deployments.

##### Best Practices
- Tune rules to minimize false positives.
- Integrate with SIEM for centralized alerting.
- Test rules in staging before production.

---

#### Threat Intelligence & Detection
##### What is Threat Intelligence & Detection?
- **Definition**: Leveraging data about known threats (e.g., attack patterns, malware signatures) to detect and respond to incidents.
- **Purpose**: Proactively identifies and mitigates risks based on real-world attack intelligence.

##### MITRE ATT&CK
- **Overview**: A knowledge base of adversary tactics, techniques, and procedures (TTPs) based on observed attacks.
- **Structure**:
  - **Tactics**: Goals (e.g., Initial Access, Privilege Escalation).
  - **Techniques**: Methods (e.g., Phishing, Credential Dumping).
- **Example Use**:
  - Map an incident: Logs show `powershell.exe` executing Base64 commands (T1059.001 - Command and Scripting Interpreter: PowerShell).
  - Mitigation: Block PowerShell execution unless approved.
- **DevSecOps Use**:
  - Simulate ATT&CK techniques with tools like Atomic Red Team:
    ```bash
    atomic-red-team invoke T1059.001
    ```
  - Monitor with Falco rules aligned to ATT&CK.

##### Suricata
- **Overview**: An open-source network intrusion detection and prevention system (IDS/IPS).
- **Features**:
  - Analyzes network traffic for threats.
  - Uses rules to detect attacks (e.g., malware C2 traffic).
- **Setup**:
  1. Install: `sudo apt install suricata`.
  2. Configure: Edit `/etc/suricata/suricata.yaml` (set interface).
  3. Run: `suricata -i eth0`.
  4. Sample Rule:
     ```suricata
     alert http $EXTERNAL_NET any -> $HOME_NET any (msg:"Malware C2 Detected"; flow:established,to_server; content:"evil.com"; http_host; sid:1000001;)
     ```
   - **Output**: Alert in `/var/log/suricata/fast.log`.
- **DevSecOps Use**: Monitor Kubernetes ingress traffic:
  ```bash
  suricata -i ens3 -c /etc/suricata/suricata.yaml
  ```

##### YARA Rules
- **Overview**: A pattern-matching tool for identifying malware or suspicious files.
- **Features**:
  - Custom rules to match file contents or attributes.
  - Lightweight and scriptable.
- **Setup**:
  1. Install: `sudo apt install yara`.
  2. Write a Rule:
     ```yara
     rule Malware_Signature {
       meta:
         description = "Detects malicious executable"
       strings:
         $a = "malicious_function" ascii
       condition:
         $a
     }
     ```
  3. Scan: `yara rule.yar suspicious_file.exe`.
   - **Output**: "Malware_Signature detected in suspicious_file.exe."
- **DevSecOps Use**: Scan container images in CI:
  ```yaml
  # GitHub Actions
  - name: YARA Scan
    run: yara rules.yar /path/to/image/filesystem
  ```

##### Integration
- **MITRE ATT&CK**: Map threats to Falco/Suricata rules.
- **Suricata**: Feed network alerts to SIEM (e.g., ELK).
- **YARA**: Use in runtime monitoring or post-incident forensics.

---

### Practical Workflow
1. **SIEM**: Deploy Splunk/ELK to aggregate logs from CI/CD and production.
2. **Runtime**: Monitor containers with Falco for suspicious activity.
3. **Threat Intel**:
   - Align Falco rules with MITRE ATT&CK.
   - Run Suricata on network edges.
   - Scan files with YARA during builds.
4. **Response**: Automate alerts to Slack and escalate critical incidents.

---

These notes provide a comprehensive foundation for security incident response and monitoring in a DevSecOps context. Let me know if you’d like deeper examples (e.g., a full Splunk setup) or integration with previous MkDocs navigation!