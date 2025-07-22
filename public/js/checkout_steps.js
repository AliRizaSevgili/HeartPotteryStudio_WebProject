document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form[action='/checkout-info']");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");
  const deliverySection = document.getElementById("delivery-section");
  const cartSection = document.getElementById("cart-section");
  const stepCart = document.getElementById("step-cart");
  const stepDelivery = document.getElementById("step-delivery");
  const stepCartBtn = document.getElementById("step-cart-btn");
  const stepDeliveryBtn = document.getElementById("step-delivery-btn");
  const progressError = document.getElementById('progress-error');

  let currentStep = 1; // Track the current step (1 = Cart, 2 = Info)

  stepCartBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (currentStep === 1) {
      cartSection.classList.remove("hidden");
      deliverySection.classList.add("hidden");
      updateProgressBar(1);
    }
  });

  stepDeliveryBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (currentStep === 2) {
      cartSection.classList.add("hidden");
      deliverySection.classList.remove("hidden");
      updateProgressBar(2);
    } else {
      showError("Please complete the Cart section before proceeding to Info.");
    }
  });

  if (form) {
    form.onsubmit = null;
    form.addEventListener("submit", function(e) {
      if (toggle && !toggle.checked) {
        if (toggleError) toggleError.classList.remove("hidden");
        e.preventDefault();
        return;
      } else {
        if (toggleError) toggleError.classList.add("hidden");
      }

      e.preventDefault();
      grecaptcha.ready(function() {
        grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', { action: 'submit' }).then(function(token) {
          document.getElementById('recaptchaToken').value = token;

          deliverySection.classList.add("hidden");
          currentStep = 2;
          updateProgressBar(2);

          form.submit();
        });
      });
    });
  }

  function updateProgressBar(step) {
    if (step === 1) {
      stepCart.classList.add("bg-indigo-500", "text-white");
      stepCart.classList.remove("bg-gray-200", "text-gray-700");
      stepDelivery.classList.add("bg-gray-200", "text-gray-700");
      stepDelivery.classList.remove("bg-indigo-500", "text-white");
    } else if (step === 2) {
      stepCart.classList.add("bg-gray-200", "text-gray-700");
      stepCart.classList.remove("bg-indigo-500", "text-white");
      stepDelivery.classList.add("bg-indigo-500", "text-white");
      stepDelivery.classList.remove("bg-gray-200", "text-gray-700");
    }
  }

  updateProgressBar(1);

  function showError(message) {
    // Hata mesajını tamamen devre dışı bırakmak için bu fonksiyon boş bırakıldı.
  }
});

