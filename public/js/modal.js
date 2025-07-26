// Üretim/geliştirme modunu kontrol et
const isProduction = window.location.hostname !== 'localhost';

// Loglama fonksiyonlarını tanımla
const logDebug = isProduction ? function(){} : console.log;
const logInfo = isProduction ? function(){} : console.info;
const logWarn = isProduction ? function(){} : console.warn;
const logError = console.error; // Hata logları her zaman gösterilmeli


document.addEventListener("DOMContentLoaded", () => {
  const modalWrapper = document.getElementById("eventModal1");

  if (!modalWrapper) return;

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const modal = mutation.target;

        const isVisible =
          modal.classList.contains("flex") &&
          !modal.classList.contains("hidden");

        if (isVisible) {
          // 🔽 Sayfayı en yukarı kaydır
          window.scrollTo({ top: 0, behavior: "smooth" });

          // ⏳ Modal scroll pozisyonunu da sıfırla (içeriği en baştan göstersin)
          setTimeout(() => {
            modal.scrollTop = 0;
            logDebug("✅ Modal açıldı, sayfa yukarı kaydırıldı");
          }, 100);
        }
      }
    }
  });

  observer.observe(modalWrapper, { attributes: true });
});
