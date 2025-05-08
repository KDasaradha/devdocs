## 🔹 **3. Advanced DevSecOps Topics (6-12 months)**  
### ✅ **5. Security Testing & Automation**  
- **SAST (Static Application Security Testing)**  
  - Tools: `SonarQube`, `Bandit`, `Checkmarx`  
- **DAST (Dynamic Application Security Testing)**  
  - Tools: `OWASP ZAP`, `Burp Suite`, `Nikto`  
- **IAST (Interactive Application Security Testing)**  
  - Tools: `Contrast Security`, `Seeker`  
- **Fuzz Testing**  
  - Tools: `AFL`, `zzuf`  

---

#### SAST (Static Application Security Testing)
##### What is SAST?
- **Definition**: Static Application Security Testing analyzes source code, bytecode, or binaries for vulnerabilities without executing the application.
- **Purpose**: Identifies security flaws early in the SDLC (shift-left), such as insecure coding patterns or hardcoded secrets.
- **How It Works**: Uses rule-based analysis to scan code against known vulnerability signatures.

##### Tools
1. **SonarQube**
   - **Overview**: An open-source platform for continuous code quality and security analysis.
   - **Features**:
     - Supports multiple languages (e.g., Java, Python, JavaScript).
     - Detects vulnerabilities (e.g., SQL injection, XSS).
     - Integrates with CI/CD (e.g., Jenkins, GitLab).
   - **Setup**:
     1. Install: `docker run -d -p 9000:9000 sonarqube`.
     2. Configure: Add a project via the web UI (default: admin/admin).
     3. Scan: `sonar-scanner -Dsonar.projectKey=my-app -Dsonar.sources=.`.
   - **Example Output**: "Potential SQL Injection in `UserDAO.java` at line 42."
   - **DevSecOps Use**: Add to CI pipeline:
     ```yaml
     # GitLab CI
     sonarqube-check:
       stage: test
       script:
         - sonar-scanner -Dsonar.projectKey=my-app
     ```

2. **Bandit**
   - **Overview**: A lightweight, Python-specific SAST tool focused on security issues.
   - **Features**:
     - Detects issues like insecure `eval()` usage or weak cryptography.
     - Fast and easy to integrate.
   - **Usage**:
     ```bash
     pip install bandit
     bandit -r ./src
     ```
   - **Example Output**: "Issue: [B105] Use of hardcoded password detected."
   - **DevSecOps Use**: Fail builds on high-severity issues:
     ```yaml
     # GitHub Actions
     - name: Bandit Scan
       run: bandit -r . -ll -x tests || exit 1
     ```

3. **Checkmarx**
   - **Overview**: An enterprise-grade SAST tool with deep code analysis.
   - **Features**:
     - Supports 25+ languages.
     - Advanced taint analysis (tracks data flow).
     - Integrates with IDEs and CI/CD.
   - **Setup**: Requires a licensed server deployment.
   - **Example**: Detects a buffer overflow in C code via static analysis.
   - **DevSecOps Use**: Use Checkmarx CLI in Jenkins:
     ```groovy
     stage('SAST') {
         steps {
             sh 'cx scan --project-name my-app --source-dir .'
         }
     }
     ```

##### Best Practices
- Run SAST on every commit to catch issues early.
- Tune rules to reduce false positives.
- Combine with code reviews for maximum effectiveness.

---

#### DAST (Dynamic Application Security Testing)
##### What is DAST?
- **Definition**: Dynamic Application Security Testing tests a running application by simulating external attacks (e.g., XSS, SQL injection).
- **Purpose**: Identifies runtime vulnerabilities that SAST might miss.
- **How It Works**: Sends malicious inputs and analyzes responses.

##### Tools
1. **OWASP ZAP**
   - **Overview**: An open-source DAST tool for web application security testing.
   - **Features**:
     - Automated and manual scanning.
     - Detects OWASP Top 10 vulnerabilities.
     - CI/CD integration.
   - **Usage**:
     ```bash
     docker run -t owasp/zap2docker-stable zap-baseline.py -t http://my-app.com
     ```
   - **Example Output**: "Alert: XSS vulnerability at /login."
   - **DevSecOps Use**: GitHub Actions:
     ```yaml
     - name: OWASP ZAP Scan
       uses: zaproxy/action-baseline@v0.7.0
       with:
         target: 'http://my-app.com'
     ```

2. **Burp Suite**
   - **Overview**: A professional-grade tool for manual and automated web security testing.
   - **Features**:
     - Advanced crawling and attack simulation.
     - Customizable for pen testing.
   - **Usage**:
     1. Launch Burp Suite (Community/Pro).
     2. Configure proxy and target: `http://my-app.com`.
     3. Run automated scan or manual tests.
   - **Example Output**: "CSRF token missing in form submission."
   - **DevSecOps Use**: Automate with Burp Enterprise in CI/CD (requires license).

3. **Nikto**
   - **Overview**: A simple, open-source web server scanner.
   - **Features**:
     - Checks for outdated software, misconfigurations.
     - Lightweight and fast.
   - **Usage**:
     ```bash
     nikto -h http://my-app.com
     ```
   - **Example Output**: "Server leaks version: Apache/2.4.29."
   - **DevSecOps Use**: GitLab CI:
     ```yaml
     nikto_scan:
       stage: test
       script:
         - nikto -h http://my-app.com -output nikto-report.txt
       artifacts:
         paths: [nikto-report.txt]
     ```

##### Best Practices
- Deploy a staging environment for DAST to avoid impacting production.
- Use authenticated scans for better coverage.
- Combine with monitoring to validate fixes.

---

#### IAST (Interactive Application Security Testing)
##### What is IAST?
- **Definition**: Interactive Application Security Testing combines SAST and DAST by analyzing code during runtime, leveraging instrumentation.
- **Purpose**: Provides real-time feedback with high accuracy.
- **How It Works**: Agents monitor application execution and report vulnerabilities.

##### Tools
1. **Contrast Security**
   - **Overview**: A commercial IAST tool with runtime protection and analysis.
   - **Features**:
     - Detects and blocks attacks in real time.
     - Integrates with development workflows.
   - **Setup**:
     1. Add Contrast agent (e.g., Java: `java -javaagent:contrast.jar -jar my-app.jar`).
     2. Monitor via Contrast dashboard.
   - **Example Output**: "SQL Injection detected in `queryUser` method."
   - **DevSecOps Use**: Embed agent in CI/CD for continuous testing.

2. **Seeker (Synopsys)**
   - **Overview**: An enterprise IAST tool focused on actionable insights.
   - **Features**:
     - Maps vulnerabilities to code lines.
     - Supports web apps and APIs.
   - **Setup**: Deploy Seeker server and integrate with app runtime.
   - **Example Output**: "XSS exploitable at /profile endpoint."
   - **DevSecOps Use**: Automate with CI plugins (e.g., Jenkins).

##### Best Practices
- Use IAST in QA/staging for detailed analysis.
- Pair with SAST for broader coverage.
- Minimize performance overhead by optimizing agent config.

---

#### Fuzz Testing
##### What is Fuzz Testing?
- **Definition**: Fuzz testing (fuzzing) involves sending random, invalid, or unexpected inputs to an application to uncover crashes, memory leaks, or security flaws.
- **Purpose**: Tests robustness and edge cases missed by traditional testing.
- **How It Works**: Generates inputs (random or guided) and monitors application behavior.

##### Tools
1. **AFL (American Fuzzing Lop)**
   - **Overview**: A high-performance fuzzer for compiled programs (e.g., C/C++).
   - **Features**:
     - Coverage-guided fuzzing (optimizes input generation).
     - Detects crashes and hangs.
   - **Setup**:
     1. Install: `sudo apt install afl`.
     2. Compile with AFL: `afl-gcc -o myprog myprog.c`.
     3. Fuzz: `afl-fuzz -i input_dir -o output_dir ./myprog @@`.
   - **Example Output**: "Crash found with input: `AAAA\x00`."
   - **DevSecOps Use**: Run in CI for critical components:
     ```yaml
     # GitLab CI
     fuzz_test:
       stage: test
       script:
         - afl-fuzz -i inputs -o outputs -t 5000 ./myprog @@
     ```

2. **zzuf**
   - **Overview**: A simple fuzzer for file-based or command-line applications.
   - **Features**:
     - Mutates inputs (e.g., flips bits).
     - Lightweight and scriptable.
   - **Usage**:
     ```bash
     zzuf -s 0:1000 -r 0.01 cat input.txt
     ```
   - **Example Output**: "Segmentation fault with seed 42."
   - **DevSecOps Use**: Test CLI tools in CI:
     ```yaml
     # GitHub Actions
     - name: Fuzz Test
       run: zzuf -s 0:100 -r 0.05 ./mytool < test_input.txt
     ```

##### Best Practices
- Target high-risk areas (e.g., parsers, network handlers).
- Use sanitizers (e.g., AddressSanitizer) with fuzzing for better detection.
- Automate fuzzing in CI with time limits to avoid infinite runs.

---

### Practical Workflow
1. **SAST**: Run SonarQube/Bandit on code commit to catch static issues.
2. **DAST**: Deploy to staging and scan with OWASP ZAP for runtime flaws.
3. **IAST**: Instrument app with Contrast in QA for real-time insights.
4. **Fuzzing**: Fuzz critical components with AFL in a separate CI job.
5. **Integration**: Fail pipeline on high-severity findings from any tool.

---

### Comparison of Testing Types
| **Type** | **When**          | **Strength**             | **Weakness**            |
|----------|-------------------|--------------------------|-------------------------|
| **SAST** | Pre-deployment    | Early detection          | False positives         |
| **DAST** | Post-deployment   | Real-world simulation    | Requires running app    |
| **IAST** | Runtime (QA)      | High accuracy            | Overhead, cost          |
| **Fuzz** | Development/Testing| Finds edge cases       | Time-intensive          |

---

These notes provide a comprehensive foundation for advanced security testing and automation in a DevSecOps context. Let me know if you’d like deeper examples (e.g., a full pipeline with all tools) or integration with previous MkDocs navigation!