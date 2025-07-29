// Frontend Logger - Tarayıcı konsoluna yazma ve opsiyonel olarak sunucuya gönderme
const frontendLogger = {
    info: function(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
        
        // İsteğe bağlı: Önemli logları sunucuya gönder
        // this._sendToServer('info', message);
    },
    
    error: function(message) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        
        // Hata loglarını sunucuya gönder
        this._sendToServer('error', message);
    },
    
    _sendToServer: function(level, message) {
        // Sunucuya log gönderme (ciddi hatalar için)
        if (level === 'error') {
            fetch('/api/client-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    level,
                    message,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => {
                // Log gönderimi başarısız olursa sessizce devam et
                console.error('Log gönderimi başarısız:', err);
            });
        }
    }
};

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
            
            frontendLogger.info('Kullanıcı checkout adımından delivery adımına geçti');
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
            
            frontendLogger.info('Kullanıcı delivery adımından sepet adımına geri döndü');
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
            
            frontendLogger.info('Kullanıcı progress bar üzerinden sepet adımına geçti');
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
                
                frontendLogger.info('Kullanıcı progress bar üzerinden delivery adımına geçti');
            } else {
                // Sepette ürün yoksa hata göster
                cartError.classList.remove('hidden');
                setTimeout(() => {
                    cartError.classList.add('hidden');
                }, 3000);
                
                frontendLogger.error('Boş sepet ile delivery adımına geçiş denemesi');
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
                frontendLogger.error('Kullanıcı koşulları kabul etmeden ödemeye geçmeye çalıştı');
                return;
            } else if (toggleError) {
                toggleError.classList.add('hidden');
            }
            
            // Form doğrulamasını yap
            if (!checkoutInfoForm.checkValidity()) {
                e.preventDefault();
                // HTML5 doğrulama mesajlarını göster
                checkoutInfoForm.reportValidity();
                frontendLogger.error('Form doğrulaması başarısız oldu');
            } else {
                frontendLogger.info('Pay Now butonuna tıklandı, form doğrulaması başarılı');
            }
        });
    }

    // Form submit işlemi - reCAPTCHA ve form gönderim yönetimi
    if (checkoutInfoForm) {
    checkoutInfoForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Formu normal gönderimini engelle

        // reCAPTCHA token'ı al
        if (typeof grecaptcha !== 'undefined') {
            frontendLogger.info('reCAPTCHA token alma işlemi başlatıldı');
            grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', {action: 'checkout'})
                .then(function(token) {
                    // reCAPTCHA token'ı gizli alana yerleştir
                    document.getElementById('recaptchaToken').value = token;
                    frontendLogger.info('reCAPTCHA token başarıyla alındı, form gönderiliyor');
                    
                    // FETCH/AJAX KULLANMADAN doğrudan form gönderimi
                    checkoutInfoForm.removeEventListener('submit', arguments.callee);
                    checkoutInfoForm.submit();
                })
                .catch(function(error) {
                    frontendLogger.error(`reCAPTCHA error: ${error}`);
                    // reCAPTCHA hatası durumunda yine de formu gönder
                    checkoutInfoForm.removeEventListener('submit', arguments.callee);
                    checkoutInfoForm.submit();
                });
        } else {
            frontendLogger.info('reCAPTCHA tanımlı değil, form doğrudan gönderiliyor');
            // reCAPTCHA yüklenmediyse formu normal şekilde gönder
            checkoutInfoForm.removeEventListener('submit', arguments.callee);
            checkoutInfoForm.submit();
        }
    });
  }
});