// docs/scripts/custom.js
document.addEventListener("DOMContentLoaded", function () {
    /* ================================
       Floating Theme Toggle Button
       ================================ */
    const toggleButton = document.createElement("button");
    toggleButton.innerHTML = "🌙";
    toggleButton.className = "custom-button"; // Use CSS class
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.zIndex = "1000";
    document.body.appendChild(toggleButton);

    // Sync with current theme on load
    const currentTheme = document.documentElement.getAttribute("data-md-color-scheme") || "default";
    toggleButton.innerHTML = currentTheme === "default" ? "🌙" : "☀️";

    toggleButton.addEventListener("click", function () {
        const newTheme = document.documentElement.getAttribute("data-md-color-scheme") === "default" ? "slate" : "default";
        document.documentElement.setAttribute("data-md-color-scheme", newTheme);
        toggleButton.innerHTML = newTheme === "default" ? "🌙" : "☀️";
        // Trigger CSS transition
        document.body.classList.add("theme-transition");
        setTimeout(() => document.body.classList.remove("theme-transition"), 300);
    });

    /* ================================
       Smooth Scrolling for Internal Links
       ================================ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 50,
                    behavior: "smooth",
                });
            }
        });
    });

    /* ================================
       Sidebar Auto-Collapse (Improved)
       ================================ */
    document.querySelectorAll(".md-nav__toggle").forEach(toggle => {
        toggle.addEventListener("click", function () {
            const nav = this.nextElementSibling;
            if (nav && nav.classList.contains("md-nav__list")) {
                nav.classList.toggle("md-nav--active");
            }
        });
    });

    /* ================================
       Floating Back to Top Button
       ================================ */
    const backToTop = document.createElement("button");
    backToTop.innerHTML = "⬆";
    backToTop.className = "custom-button"; // Use CSS class
    backToTop.style.position = "fixed";
    backToTop.style.bottom = "80px";
    backToTop.style.right = "20px";
    backToTop.style.zIndex = "1000";
    backToTop.style.display = "none";
    document.body.appendChild(backToTop);

    backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", function () {
        backToTop.style.display = window.scrollY > 300 ? "block" : "none";
    });
});