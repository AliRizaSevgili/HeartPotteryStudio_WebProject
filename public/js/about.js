document.addEventListener("DOMContentLoaded", function () {
    const overlay = document.getElementById("overlay");
    const textContent = document.getElementById("text-content");
    const title = document.getElementById("about-title");

    function adjustTextSize() {
        const bgColor = window.getComputedStyle(overlay).backgroundColor;
        const isLargeScreen = window.innerWidth > 1400;

        if (bgColor === "rgba(0, 0, 0, 0.4)") {
            textContent.style.fontSize = isLargeScreen ? "1rem" : "1.125rem";
            title.style.fontSize = isLargeScreen ? "1.375rem" : "1.5rem";
            textContent.style.lineHeight = "1.5";
        } else {
            textContent.style.fontSize = "";
            textContent.style.lineHeight = "";
            title.style.fontSize = "";
        }
    }

    // **Debounce Fonksiyonu ile Optimize Ediyoruz**
    function debounce(func, delay) {
        let timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(func, delay);
        };
    }

    // **Observer ile izlemeyi başlat**
    const observer = new MutationObserver(debounce(adjustTextSize, 100));
    observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

    // **Pencere yeniden boyutlandığında güncelle**
    window.addEventListener("resize", debounce(adjustTextSize, 100));

    // **Opaklık animasyonu tamamlandığında çalıştır**
    overlay.addEventListener("transitionend", adjustTextSize);

    // **Sayfa yüklendiğinde bir kez çalıştır**
    adjustTextSize();
});
