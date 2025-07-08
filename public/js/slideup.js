// filepath: public/js/slideup.js
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(".animate-slideUpOnVisible");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-slideUp");
        entry.target.classList.remove("opacity-0");
      } else {
        entry.target.classList.remove("animate-slideUp");
        entry.target.classList.add("opacity-0");
      }
    });
  }, {
    threshold: 0.3
  });

  targets.forEach(target => observer.observe(target));
});