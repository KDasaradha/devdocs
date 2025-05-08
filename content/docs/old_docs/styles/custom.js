document.addEventListener("DOMContentLoaded", function () {
    /* ================================
       Floating Theme Toggle Button
       ================================ */
    let toggleButton = document.createElement("button");
    toggleButton.innerHTML = "🌙";
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.background = "#007bff";
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.padding = "12px";
    toggleButton.style.borderRadius = "50%";
    toggleButton.style.fontSize = "20px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.zIndex = "1000";
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener("click", function () {
        let currentTheme = document.documentElement.getAttribute("data-md-color-scheme");
        if (currentTheme === "default") {
            document.documentElement.setAttribute("data-md-color-scheme", "slate");
            toggleButton.innerHTML = "☀️";
        } else {
            document.documentElement.setAttribute("data-md-color-scheme", "default");
            toggleButton.innerHTML = "🌙";
        }
    });

    /* ================================
       Smooth Scrolling for Internal Links
       ================================ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            let targetId = this.getAttribute("href").substring(1);
            let targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 50,
                    behavior: "smooth",
                });
            }
        });
    });

    /* ================================
       Sidebar Auto-Collapse
       ================================ */
    document.querySelectorAll(".md-nav__toggle").forEach(toggle => {
        toggle.addEventListener("click", function () {
            setTimeout(() => {
                document.querySelectorAll(".md-nav__list").forEach(nav => {
                    if (!nav.classList.contains("md-nav__list--nested")) {
                        nav.classList.toggle("hidden");
                    }
                });
            }, 200);
        });
    });

    /* ================================
       Floating Back to Top Button
       ================================ */
    let backToTop = document.createElement("button");
    backToTop.innerHTML = "⬆";
    backToTop.style.position = "fixed";
    backToTop.style.bottom = "80px";
    backToTop.style.right = "20px";
    backToTop.style.background = "#007bff";
    backToTop.style.color = "white";
    backToTop.style.border = "none";
    backToTop.style.padding = "12px";
    backToTop.style.borderRadius = "50%";
    backToTop.style.fontSize = "20px";
    backToTop.style.cursor = "pointer";
    backToTop.style.display = "none";
    backToTop.style.zIndex = "1000";
    document.body.appendChild(backToTop);

    backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            backToTop.style.display = "block";
        } else {
            backToTop.style.display = "none";
        }
    });
});
