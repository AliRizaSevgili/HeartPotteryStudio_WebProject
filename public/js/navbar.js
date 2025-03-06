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

  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("active");
      mobileMenu.classList.toggle("hidden");
      body.classList.toggle("menu-open");

      // Menünün açık kalmasını önlemek için localStorage kullanarak durumu kaydet
      if (mobileMenu.classList.contains("active")) {
        localStorage.setItem("mobileMenuState", "open");
      } else {
        localStorage.setItem("mobileMenuState", "closed");
      }
    });
  }

  if (closeMenuButton) {
    closeMenuButton.addEventListener("click", function () {
      mobileMenu.classList.remove("active");
      mobileMenu.classList.add("hidden");
      body.classList.remove("menu-open");
      localStorage.setItem("mobileMenuState", "closed");
    });
  }

  // Menü dışında bir yere tıklanınca kapatma
  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (event) {
      if (event.target === mobileMenu) {
        mobileMenu.classList.remove("active");
        mobileMenu.classList.add("hidden");
        body.classList.remove("menu-open");
        localStorage.setItem("mobileMenuState", "closed");
      }
    });
  }

  // Sayfa yüklendiğinde menü durumunu kontrol et
  if (localStorage.getItem("mobileMenuState") === "closed") {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("active");
    body.classList.remove("menu-open");
  }
});
