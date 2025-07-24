// Token değerini localStorage'da saklamak için fonksiyonlar
function saveTokenToStorage(token) {
    localStorage.setItem('eventsRecaptchaToken', token);
}

function getTokenFromStorage() {
    return localStorage.getItem('eventsRecaptchaToken');
}

// DOM yüklendikten sonra
document.addEventListener("DOMContentLoaded", function () {
    // Form ve token input'unu seç
    const form = document.querySelector("form[action='/events']");
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
            
            // Toggle kontrolü
            const toggle = document.getElementById("toggle-agreement");
            const toggleError = document.getElementById("toggle-error");
            
            if (toggle && !toggle.checked) {
                if (toggleError) toggleError.classList.remove("hidden");
                e.preventDefault();
                return;
            } else {
                if (toggleError) toggleError.classList.add("hidden");
            }
            
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