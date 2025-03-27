document.addEventListener("DOMContentLoaded", () => {
  // 📞 Phone input karakter sınırlayıcı
  const contactNumber = document.getElementById("contactNumber");
  if (contactNumber) {
    contactNumber.addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/[^+\d\s-]/g, '');
    });
  }

  // ✅ Toggle onay kontrolü
  const form = document.querySelector("form");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");

  if (form && toggle) {
    form.addEventListener("submit", function (e) {
      if (!toggle.checked) {
        e.preventDefault();
        // Hata mesajını göster
        if (toggleError) toggleError.classList.remove("hidden");
      } else {
        // Hata mesajı görünüyorsa gizle
        if (toggleError) toggleError.classList.add("hidden");
      }
    });

    // Hata mesajı tıklanınca otomatik kalksın
    toggle.addEventListener("change", function () {
      if (toggle.checked && toggleError) {
        toggleError.classList.add("hidden");
      }
    });
  }

  // 🔄 Eski toggle switch hareketi (eğer kullanılıyorsa)
  const roleToggle = document.querySelector('[role="switch"]');
  if (roleToggle) {
    roleToggle.addEventListener('click', function () {
      const isChecked = this.getAttribute('aria-checked') === 'true';
      this.setAttribute('aria-checked', String(!isChecked));
      this.querySelector('span[aria-hidden="true"]').classList.toggle('translate-x-3.5');
      this.querySelector('span[aria-hidden="true"]').classList.toggle('translate-x-0');
    });
  }
});


