document.addEventListener('DOMContentLoaded', function() {
    // Butonları seçme
    const goToDeliveryBtn = document.getElementById('go-to-delivery');
    const backToCartBtn = document.getElementById('back-to-cart');
    const stepCartBtn = document.getElementById('step-cart-btn');
    const stepDeliveryBtn = document.getElementById('step-delivery-btn');
    
    // Bölümleri seçme
    const cartSection = document.getElementById('cart-section');
    const deliverySection = document.getElementById('delivery-section');
    const stepCart = document.getElementById('step-cart');
    const stepDelivery = document.getElementById('step-delivery');
    
    // Hata kutucukları
    const progressError = document.getElementById('progress-error');
    const cartError = document.getElementById('cart-error');
    const deliveryError = document.getElementById('delivery-error');
    
    // Checkout butonuna tıklama işlemi
    if (goToDeliveryBtn) {
        goToDeliveryBtn.addEventListener('click', function() {
            // Sepet kısmını gizle, form kısmını göster
            cartSection.style.display = 'none';
            deliverySection.classList.remove('hidden');
            
            // Progress bar'ı güncelle
            stepCart.classList.remove('bg-indigo-500', 'text-white');
            stepCart.classList.add('bg-gray-200', 'text-gray-700');
            
            stepDelivery.classList.remove('bg-gray-200', 'text-gray-700');
            stepDelivery.classList.add('bg-indigo-500', 'text-white');
            
            // Kaydırma
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Sepete geri dön butonuna tıklama
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', function() {
            // Form kısmını gizle, sepet kısmını göster
            deliverySection.classList.add('hidden');
            cartSection.style.display = 'block';
            
            // Progress bar'ı güncelle
            stepDelivery.classList.remove('bg-indigo-500', 'text-white');
            stepDelivery.classList.add('bg-gray-200', 'text-gray-700');
            
            stepCart.classList.remove('bg-gray-200', 'text-gray-700');
            stepCart.classList.add('bg-indigo-500', 'text-white');
            
            // Kaydırma
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Progress bar butonlarına tıklama
    if (stepCartBtn) {
        stepCartBtn.addEventListener('click', function() {
            deliverySection.classList.add('hidden');
            cartSection.style.display = 'block';
            
            stepDelivery.classList.remove('bg-indigo-500', 'text-white');
            stepDelivery.classList.add('bg-gray-200', 'text-gray-700');
            
            stepCart.classList.remove('bg-gray-200', 'text-gray-700');
            stepCart.classList.add('bg-indigo-500', 'text-white');
        });
    }
    
    if (stepDeliveryBtn) {
        stepDeliveryBtn.addEventListener('click', function() {
            // Sepette ürün varsa form adımına geçiş yap
            if (cartSection.querySelector('.md\\:flex') || 
                (cartSection.querySelector('p') && 
                 !cartSection.querySelector('p').textContent.includes('empty'))) {
                
                cartSection.style.display = 'none';
                deliverySection.classList.remove('hidden');
                
                stepCart.classList.remove('bg-indigo-500', 'text-white');
                stepCart.classList.add('bg-gray-200', 'text-gray-700');
                
                stepDelivery.classList.remove('bg-gray-200', 'text-gray-700');
                stepDelivery.classList.add('bg-indigo-500', 'text-white');
            } else {
                // Sepette ürün yoksa hata göster
                cartError.classList.remove('hidden');
                setTimeout(() => {
                    cartError.classList.add('hidden');
                }, 3000);
            }
        });
    }
    
    // Form doğrulama işlevi - Pay Now butonuna tıklamadan önce
    const checkoutInfoForm = document.getElementById('checkout-info-form');
    const payNowBtn = document.getElementById('pay-now-btn');
    
    if (payNowBtn && checkoutInfoForm) {
        payNowBtn.addEventListener('click', function(e) {
            // Kullanıcının anlaşmayı kabul edip etmediğini kontrol et
            const toggleAgreement = document.getElementById('toggle-agreement');
            const toggleError = document.getElementById('toggle-error');
            
            if (toggleAgreement && !toggleAgreement.checked) {
                e.preventDefault();
                toggleError.classList.remove('hidden');
                return;
            } else if (toggleError) {
                toggleError.classList.add('hidden');
            }
            
            // Form doğrulamasını yap
            if (!checkoutInfoForm.checkValidity()) {
                e.preventDefault();
                // HTML5 doğrulama mesajlarını göster
                checkoutInfoForm.reportValidity();
            }
        });
    }
});