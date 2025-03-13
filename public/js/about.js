document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("overlay");
  const textContent = document.getElementById("text-content");
  const title = document.getElementById("about-title");

  function adjustTextSize() {
      requestAnimationFrame(() => {
          requestAnimationFrame(() => { // **İki kere çağırarak hemen uygulanmasını sağlıyoruz**
              const bgColor = window.getComputedStyle(overlay).backgroundColor;
              const isLargeScreen = window.innerWidth > 1400;

              if (bgColor === "rgba(0, 0, 0, 0.4)") {
                  if (isLargeScreen) {
                      textContent.style.fontSize = "1rem"; // Büyük ekranda biraz küçült
                      title.style.fontSize = "1.375rem"; // Başlığı biraz küçült
                  } else {
                      textContent.style.fontSize = "1.125rem"; // Normal text-lg boyutu
                      title.style.fontSize = "1.5rem"; // Normal başlık boyutu
                  }
                  textContent.style.lineHeight = "1.5";
              } else {
                  textContent.style.fontSize = "";
                  textContent.style.lineHeight = "";
                  title.style.fontSize = "";
              }
          });
      });
  }

  // **Metinlerin animasyonla gelmesini sağla**
  function showTextWithAnimation() {
      setTimeout(() => {
          textContent.classList.add("opacity-100", "translate-y-0");
          title.classList.add("opacity-100", "translate-y-0");
      }, 500); // **500ms gecikme (yarım saniye)**
  }

  // **Opaklık değiştiğinde metinleri anında güncelle**
  const observer = new MutationObserver(() => {
      adjustTextSize();
      showTextWithAnimation();
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  // **Tarayıcı Pencere Boyutu Değiştiğinde de Güncelle**
  window.addEventListener("resize", adjustTextSize);

  // **Opaklık Animasyonu Tamamlandığında Güncelle**
  overlay.addEventListener("transitionend", adjustTextSize);

  adjustTextSize(); // Sayfa yüklendiğinde bir kez çalıştır
  showTextWithAnimation(); // Sayfa yüklendiğinde animasyonu başlat
});
