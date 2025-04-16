



document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeMenuButton = document.getElementById("close-menu");
  const body = document.body;

  // Sayfa yüklendiğinde menüyü kapalı başlat
  if (mobileMenu) {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("active");
    body.classList.remove("menu-open");
  }

  // Hamburger menü butonuna tıklanırsa menüyü aç/kapat
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("active");
      mobileMenu.classList.toggle("hidden");
      body.classList.toggle("menu-open");

      // Menü durumu belleğe kaydedilir
      if (mobileMenu.classList.contains("active")) {
        localStorage.setItem("mobileMenuState", "open");
      } else {
        localStorage.setItem("mobileMenuState", "closed");
      }
    });
  }

  // X butonuna tıklanınca menüyü kapat
  if (closeMenuButton) {
    closeMenuButton.addEventListener("click", function () {
      mobileMenu.classList.remove("active");
      mobileMenu.classList.add("hidden");
      body.classList.remove("menu-open");
      mobileMenuButton.style.display = "flex";
      localStorage.setItem("mobileMenuState", "closed");
    });
  }

  // Menü dışında bir yere tıklanırsa menüyü kapat
  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (event) {
      if (event.target === mobileMenu) {
        mobileMenu.classList.remove("active");
        mobileMenu.classList.add("hidden");
        body.classList.remove("menu-open");
        mobileMenuButton.style.display = "flex";
        localStorage.setItem("mobileMenuState", "closed");
      }
    });
  }

  // Sayfa yüklendiğinde önceki menü durumu kontrol edilir
  if (localStorage.getItem("mobileMenuState") === "closed") {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("active");
    body.classList.remove("menu-open");
  }

  // Ekran yeniden boyutlandırıldığında kontrol et
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      if (mobileMenu) {
        mobileMenu.classList.add("hidden");
        mobileMenu.classList.remove("active");
        body.classList.remove("menu-open");

        // Hamburger ikonunu geri göster
        if (mobileMenuButton) {
          mobileMenuButton.style.display = "flex";
        }

        // Menü durumu bellekte de kapalı olarak güncellenir
        localStorage.setItem("mobileMenuState", "closed");
      }
    }
  });
});
