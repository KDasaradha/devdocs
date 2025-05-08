# 🚀 **Git & GitHub Actions Learning Roadmap: Beginner to Pro**  

This roadmap is divided into **three levels**:  
1️⃣ **Beginner (Git Basics & GitHub Fundamentals)**  
2️⃣ **Intermediate (Branching, Merging, and Collaboration)**  
3️⃣ **Advanced/Pro (GitHub Actions, CI/CD Pipelines, and Automation)**  

---

## 🟢 **1. Beginner: Git Basics & GitHub Fundamentals**  

### **🔹 What to Learn?**  
✅ **What is Git & Why Use It?**  
- Version control system (VCS) overview  
- Git vs. GitHub vs. GitLab vs. Bitbucket  
- Installing Git on Windows, macOS, and Linux  

✅ **Basic Git Commands**  
- `git init` → Initialize a repository  
- `git clone <repo>` → Clone a repository  
- `git add <file>` → Stage changes  
- `git commit -m "message"` → Save changes  
- `git status` → Check changes  
- `git log` → View commit history  

✅ **Working with GitHub**  
- Creating a GitHub repository  
- Pushing changes to GitHub (`git push`)  
- Pulling changes (`git pull`)  
- Forking repositories & making pull requests (PRs)  

✅ **.gitignore & Git Configuration**  
- Creating a `.gitignore` file  
- Configuring Git user details (`git config --global user.name "Your Name"`)  

✅ **Hands-on Projects**  
1. Create a GitHub repo and push a simple **FastAPI or React project**  
2. Fork a public GitHub repo & make a pull request  

---

## 🟡 **2. Intermediate: Branching, Merging, and Collaboration**  

### **🔹 What to Learn?**  
✅ **Git Branching & Merging**  
- `git branch <branch_name>` → Create a new branch  
- `git checkout <branch_name>` → Switch branches  
- `git merge <branch_name>` → Merge branches  
- Resolving merge conflicts manually  

✅ **Git Rebase & Cherry-pick**  
- `git rebase main` → Rebasing vs. merging  
- `git cherry-pick <commit_id>` → Applying specific commits  

✅ **Collaborating with Teams**  
- **Pull Requests (PRs)** and **Code Reviews**  
- Using **GitHub Issues** and **Projects**  
- Protecting branches & enforcing PR reviews  

✅ **Undoing Changes & Fixing Mistakes**  
- `git reset --soft HEAD~1` → Undo last commit (keep changes)  
- `git reset --hard HEAD~1` → Undo last commit (discard changes)  
- `git revert <commit_id>` → Revert specific commit  

✅ **Git Tags & Releases**  
- Creating **versioned releases** (`git tag v1.0.0`)  
- Pushing tags to GitHub (`git push --tags`)  

✅ **Hands-on Projects**  
1. Set up **feature branches** for a FastAPI microservices project  
2. Practice **rebase, cherry-pick, and fixing merge conflicts**  

---

## 🔴 **3. Advanced/Pro: GitHub Actions, CI/CD, and Automation**  

### **🔹 What to Learn?**  
✅ **Introduction to GitHub Actions**  
- What is **GitHub Actions**? Why use it?  
- Understanding **workflows, jobs, and actions**  
- Writing a basic GitHub Actions workflow (`.github/workflows/main.yml`)  

✅ **Automating CI/CD with GitHub Actions**  
- Running **tests automatically** on every push  
- Setting up **FastAPI + PostgreSQL CI/CD pipeline**  
- Deploying Docker containers using GitHub Actions  

✅ **Advanced GitHub Actions Concepts**  
- Using **Secrets & Environment Variables**  
- **Matrix builds** for different OS versions  
- **Caching dependencies** to speed up builds  
- Running jobs **conditionally**  

✅ **Security & Best Practices**  
- Using **Dependabot** for dependency updates  
- Restricting access with **branch protection rules**  
- Secure **API keys** using GitHub Secrets  

✅ **Integrating GitHub Actions with Kubernetes & Terraform**  
- Deploying **FastAPI microservices** to Kubernetes using GitHub Actions  
- Automating **Terraform infrastructure** deployment  

✅ **Hands-on Projects**  
1. **GitHub Actions pipeline** for FastAPI & PostgreSQL  
2. **CI/CD workflow** for a React app  
3. Deploying Docker containers using **GitHub Actions + Kubernetes**  

---

## 📚 **Resources for Learning Git & GitHub Actions**  
1. **Official Git Docs** → [Git Documentation](https://git-scm.com/doc)  
2. **GitHub Actions Docs** → [GitHub Actions](https://docs.github.com/en/actions)  
3. **Free Courses** →  
   - Learn Git in 1 Hour → [YouTube](https://www.youtube.com/watch?v=USjZcfj8yxE)  
   - GitHub Actions for DevOps → [YouTube](https://www.youtube.com/watch?v=R8_veQiYBjI)  
   - GitHub Actions CI/CD → [Udemy](https://www.udemy.com/course/github-actions/)  

---

## 🎯 **Final Thoughts**  
By following this roadmap, you'll master **Git, GitHub collaboration, and CI/CD automation with GitHub Actions**. Let me know if you need **specific workflows or hands-on projects** tailored for your FastAPI or microservices setup! 🚀