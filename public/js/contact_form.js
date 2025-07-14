document.addEventListener("DOMContentLoaded", () => {
  // 📞 Phone input karakter sınırlayıcı
  const contactNumber = document.getElementById("contactNumber");
  if (contactNumber) {
    contactNumber.addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/[^+\d\s-]/g, '');
    });
  }

  // ✅ Toggle onay kontrolü (sadece hata mesajı göster/gizle)
  const form = document.querySelector("form");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");

  if (form && toggle && toggleError) {
    form.addEventListener("submit", function () {
      if (!toggle.checked) {
        toggleError.classList.remove("hidden");
      } else {
        toggleError.classList.add("hidden");
      }
    });

    toggle.addEventListener("change", function () {
      if (toggle.checked) {
        toggleError.classList.add("hidden");
      }
    });
  }

  // 🔄 Eski toggle switch hareketi (eğer kullanılıyorsa)
  const roleToggle = document.querySelector('[role="switch"]');
  if (roleToggle) {
    roleToggle.addEventListener("click", function () {
      const isChecked = this.getAttribute("aria-checked") === "true";
      this.setAttribute("aria-checked", String(!isChecked));
      this.querySelector("span[aria-hidden='true']").classList.toggle("translate-x-3.5");
      this.querySelector("span[aria-hidden='true']").classList.toggle("translate-x-0");
    });
  }
});
