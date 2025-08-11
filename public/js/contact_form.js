document.addEventListener("DOMContentLoaded", () => {
  // 📞 Modern telefon formatı - Sadece rakam alıp otomatik formatlama
  const contactNumber = document.getElementById("contactNumber");
  if (contactNumber) {
    contactNumber.addEventListener("input", function (e) {
      // Sadece rakamları al
      const numbersOnly = e.target.value.replace(/\D/g, '');
      
      // Rakamları formatlı hale getir
      let formattedNumber = '';
      
      if (numbersOnly.length > 0) {
        // İlk 3 rakam (alan kodu)
        formattedNumber = numbersOnly.substring(0, 3);
        
        // Sonraki 3 rakam
        if (numbersOnly.length > 3) {
          formattedNumber += " " + numbersOnly.substring(3, 6);
          
          // Son 4 rakam
          if (numbersOnly.length > 6) {
            formattedNumber += " " + numbersOnly.substring(6, 10);
          }
        }
      }
      
      // Değeri güncelle
      e.target.value = formattedNumber;
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
