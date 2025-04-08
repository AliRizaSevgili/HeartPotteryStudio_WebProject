


document.addEventListener("DOMContentLoaded", () => {
  // Scroll to Group Booking
  const scrollButton = document.getElementById("scrollToGroup");
  const targetSection = document.getElementById("scrollTarget");

  if (scrollButton && targetSection) {
    scrollButton.addEventListener("click", (e) => {
      e.preventDefault();
      const offset = 100;
      const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    });
  }

  // Scroll-triggered animation for featured-line
  const featuredLine = document.getElementById("featured-line");

  if (featuredLine) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 🔁 Class'ı sıfırla → yeniden ekle → animasyon tekrar başlar
            featuredLine.classList.remove("animate-slide-in");
            void featuredLine.offsetWidth; // reflow için: animasyonu sıfırlar
            featuredLine.classList.add("animate-slide-in");

            console.log("🎯 Animasyon sınıfı yeniden eklendi (scroll ile tetiklendi)");
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(featuredLine);
  }
  // Scroll-triggered animation for with-us line
const withusLine = document.getElementById("withus-line");

if (withusLine) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          withusLine.classList.remove("animate-slide-in");
          void withusLine.offsetWidth; // Reflow
          withusLine.classList.add("animate-slide-in");

          console.log("🎯 with-us çizgisi animasyonu tetiklendi!");
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(withusLine);
}

});
