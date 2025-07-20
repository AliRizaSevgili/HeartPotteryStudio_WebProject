document.addEventListener("DOMContentLoaded", function() {
  // Bölümler
  const cartSection = document.getElementById('cart-section');
  const deliverySection = document.getElementById('delivery-section');
  const paymentSection = document.getElementById('payment-section');
  // Stepper
  const stepCart = document.getElementById('step-cart');
  const stepDelivery = document.getElementById('step-delivery');
  const stepPayment = document.getElementById('step-payment');
  // Butonlar
  const goToDelivery = document.getElementById('go-to-delivery');
  const goToPayment = document.getElementById('go-to-payment');
  const backToCart = document.getElementById('back-to-cart');
  const backToDelivery = document.getElementById('back-to-delivery');
  // Stepper buttonlar
  const stepCartBtn = document.getElementById('step-cart-btn');
  const stepDeliveryBtn = document.getElementById('step-delivery-btn');
  const stepPaymentBtn = document.getElementById('step-payment-btn');

  const cartError = document.getElementById('cart-error');
  const deliveryError = document.getElementById('delivery-error');
  const paymentError = document.getElementById('payment-error');

  let currentStep = 1; // Track the current step (1 = Cart, 2 = Delivery, 3 = Payment)

  function setStep(step) {
    stepCart.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors " + (step === 1 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700");
    stepDelivery.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors " + (step === 2 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700");
    stepPayment.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors " + (step === 3 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700");
  }

  function showError(errorElement) {
    // Tüm hata kutucuklarını gizle
    cartError.classList.add('hidden');
    deliveryError.classList.add('hidden');
    paymentError.classList.add('hidden');

    // İlgili hata kutucuğunu göster
    errorElement.classList.remove('hidden');
    setTimeout(() => errorElement.classList.add('hidden'), 5000); // 5 saniye sonra gizle
  }

  // Başlangıç: sadece Cart açık
  if (cartSection) cartSection.classList.remove('hidden');
  if (deliverySection) deliverySection.classList.add('hidden');
  if (paymentSection) paymentSection.classList.add('hidden');
  setStep(1);

  // Cart → Delivery
  if (goToDelivery) {
    goToDelivery.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep === 1) {
        if (cartSection) cartSection.classList.add('hidden');
        if (deliverySection) deliverySection.classList.remove('hidden');
        if (paymentSection) paymentSection.classList.add('hidden');
        setStep(2);
        currentStep = 2; // Move to step 2
        if (deliverySection) window.scrollTo({ top: deliverySection.offsetTop - 40, behavior: 'smooth' });
      }
    });
  }

  // Delivery → Payment
  if (goToPayment) {
    goToPayment.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep === 2) {
        if (cartSection) cartSection.classList.add('hidden');
        if (deliverySection) deliverySection.classList.add('hidden');
        if (paymentSection) paymentSection.classList.remove('hidden');
        setStep(3);
        currentStep = 3; // Move to step 3
        if (paymentSection) window.scrollTo({ top: paymentSection.offsetTop - 40, behavior: 'smooth' });
      }
    });
  }

  // Delivery → Cart (geri)
  if (backToCart) {
    backToCart.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep >= 2) {
        if (cartSection) cartSection.classList.remove('hidden');
        if (deliverySection) deliverySection.classList.add('hidden');
        if (paymentSection) paymentSection.classList.add('hidden');
        setStep(1);
        currentStep = 1; // Move back to step 1
        if (cartSection) window.scrollTo({ top: cartSection.offsetTop - 40, behavior: 'smooth' });
      }
    });
  }

  // Payment → Delivery (geri)
  if (backToDelivery) {
    backToDelivery.addEventListener('click', function(e) {
      e.preventDefault();
      // Kullanıcıyı Payment'tan Delivery'ye geri götür
      if (paymentSection) paymentSection.classList.add('hidden');
      if (deliverySection) deliverySection.classList.remove('hidden');
      setStep(2); // Adımı 2'ye ayarla
      currentStep = 2; // Current step'i güncelle
      if (deliverySection) window.scrollTo({ top: deliverySection.offsetTop - 40, behavior: 'smooth' });
    });
  }

  // Stepper tıklanabilirlik
  if (stepCartBtn) {
    stepCartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep >= 1) {
        cartSection.classList.remove('hidden');
        deliverySection.classList.add('hidden');
        paymentSection.classList.add('hidden');
        setStep(1);
      }
    });
  }
  if (stepDeliveryBtn) {
    stepDeliveryBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep >= 2) {
        cartSection.classList.add('hidden');
        deliverySection.classList.remove('hidden');
        paymentSection.classList.add('hidden');
        setStep(2);
      } else {
        showError(cartError); // Cart tamamlanmadıysa hata göster
      }
    });
  }
  if (stepPaymentBtn) {
    stepPaymentBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentStep === 3) {
        cartSection.classList.add('hidden');
        deliverySection.classList.add('hidden');
        paymentSection.classList.remove('hidden');
        setStep(3);
      } else if (currentStep === 2) {
        showError(deliveryError); // Info tamamlanmadıysa hata göster
      } else {
        showError(cartError); // Cart tamamlanmadıysa hata göster
      }
    });
  }
});
  
