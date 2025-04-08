

document.addEventListener("DOMContentLoaded", () => {
  const scrollButton = document.getElementById("scrollToGroup");
  const targetSection = document.getElementById("scrollTarget");

  scrollButton.addEventListener("click", (e) => {
    e.preventDefault();
    const offset = 100; // kaç px yukarıdan başlasın (örnek: 100px)
    const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth"
    });
  });
});
