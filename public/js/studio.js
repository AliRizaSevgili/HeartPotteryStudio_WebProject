// Token değerini localStorage'da saklamak için fonksiyonlar
function saveTokenToStorage(token) {
    localStorage.setItem('recaptchaToken', token);
}

function getTokenFromStorage() {
    return localStorage.getItem('recaptchaToken');
}

// DOM yüklendikten sonra
document.addEventListener("DOMContentLoaded", function () {
    // Form ve token input'unu seç
    const form = document.querySelector("form[action='/join']");
    const recaptchaTokenInput = document.getElementById('recaptchaToken');
    
    if (!recaptchaTokenInput) {
        return;
    }
    
    // localStorage'dan kayıtlı token varsa yükle
    const storedToken = getTokenFromStorage();
    if (storedToken) {
        recaptchaTokenInput.value = storedToken;
    }
    
    // 500ms'de bir token değerini kontrol et ve gerekirse güncelle
    setInterval(function() {
        const currentToken = getTokenFromStorage();
        if (currentToken && recaptchaTokenInput.value !== currentToken) {
            recaptchaTokenInput.value = currentToken;
        }
    }, 500);
    
    // reCAPTCHA API'sinin yüklenip yüklenmediğini kontrol et
    function checkRecaptcha() {
        if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.ready === 'function') {
            grecaptcha.ready(function() {
                grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', { action: 'submit' })
                    .then(function(token) {
                        saveTokenToStorage(token);
                        if (recaptchaTokenInput) {
                            recaptchaTokenInput.value = token;
                            setTimeout(() => {
                                // Token değeri kontrol işlemi burada
                            }, 100);
                        }
                    })
                    .catch(function(error) {
                        // Hata durumu
                    });
            });
        } else {
            setTimeout(checkRecaptcha, 500);
        }
    }
    
    // reCAPTCHA kontrolünü başlat
    checkRecaptcha();
    
    // Form gönderildiğinde
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // localStorage'dan token al ve form'a ata
            const currentToken = getTokenFromStorage();
            if (currentToken) {
                recaptchaTokenInput.value = currentToken;
                
                // Form gönder
                setTimeout(() => {
                    form.submit();
                }, 100);
            } else {
                // Yeni token oluşturmayı dene
                checkRecaptcha();
                setTimeout(() => {
                    const newToken = getTokenFromStorage();
                    if (newToken) {
                        recaptchaTokenInput.value = newToken;
                        form.submit();
                    } else {
                        alert('reCAPTCHA doğrulaması yapılamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
                    }
                }, 1500);
            }
        });
    }
});

// Sayfa tamamen yüklendiğinde
window.addEventListener('load', function() {
    // reCAPTCHA token'ını yenile
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.ready === 'function') {
        grecaptcha.ready(function() {
            grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', { action: 'submit' })
                .then(function(token) {
                    saveTokenToStorage(token);
                    
                    const recaptchaTokenInput = document.getElementById('recaptchaToken');
                    if (recaptchaTokenInput) {
                        recaptchaTokenInput.value = token;
                    }
                });
        });
    }
});