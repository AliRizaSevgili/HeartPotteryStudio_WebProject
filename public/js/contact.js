// Token değerini localStorage'da saklamak için fonksiyonlar
function saveTokenToStorage(token) {
    localStorage.setItem('contactRecaptchaToken', token);
}

function getTokenFromStorage() {
    return localStorage.getItem('contactRecaptchaToken');
}

document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form[action='/contact']");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");
  const recaptchaTokenInput = document.getElementById('recaptchaToken');
  
  if (!recaptchaTokenInput) {
    return;
  }
  
  // localStorage'dan kayıtlı token varsa yükle
  const storedToken = getTokenFromStorage();
  if (storedToken) {
    recaptchaTokenInput.value = storedToken;
  }
  
  // Token değerini düzenli kontrol et
  setInterval(function() {
    const currentToken = getTokenFromStorage();
    if (currentToken && recaptchaTokenInput.value !== currentToken) {
      recaptchaTokenInput.value = currentToken;
    }
  }, 500);
  
  // reCAPTCHA API kontrolü
  function checkRecaptcha() {
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.ready === 'function') {
      grecaptcha.ready(function() {
        grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', {action: 'submit'})
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
  
  checkRecaptcha();
  
  if (form) {
    form.onsubmit = null;
    form.addEventListener("submit", function(e) {
      // Toggle kontrolü
      if (toggle && !toggle.checked) {
        if (toggleError) toggleError.classList.remove("hidden");
        e.preventDefault();
        return;
      } else {
        if (toggleError) toggleError.classList.add("hidden");
      }
      
      e.preventDefault();
      
      // Token ata ve formu gönder
      const currentToken = getTokenFromStorage();
      if (currentToken) {
        recaptchaTokenInput.value = currentToken;
        setTimeout(() => {
          form.submit();
        }, 100);
      } else {
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
  if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.ready === 'function') {
    grecaptcha.ready(function() {
      grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', {action: 'submit'})
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