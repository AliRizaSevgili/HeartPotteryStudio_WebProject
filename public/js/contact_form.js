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
  const successMessage = document.getElementById("success-message");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault(); // Default form gönderimini durdur

      // Onay kutusu kontrolü
      if (!toggle.checked) {
        if (toggleError) toggleError.classList.remove("hidden");
        return;
      } else {
        if (toggleError) toggleError.classList.add("hidden");
      }

      // Form verilerini JSON formatına çevir
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // JSON formatı olarak gönder
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          successMessage?.classList.remove("hidden");
          form.reset();

          setTimeout(() => {
            successMessage?.classList.add("hidden");
          }, 5000);
        } else {
          alert("Something went wrong. Please try again later.");
        }
      } catch (err) {
        console.error("Form error:", err);
        alert("Failed to submit the form.");
      }
    });

    // Onay kutusundaki değişiklikte hata mesajını gizle
    toggle.addEventListener("change", function () {
      if (toggle.checked && toggleError) {
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
