// Üretim/geliştirme modunu kontrol et
const isProduction = window.location.hostname !== 'localhost';

// Loglama fonksiyonlarını tanımla
const logDebug = isProduction ? function(){} : console.log;
const logInfo = isProduction ? function(){} : console.info;
const logWarn = isProduction ? function(){} : console.warn;
const logError = console.error; // Hata logları her zaman gösterilmeli

logDebug("Page flags:", {
  isHomepagePage: document.body.getAttribute('data-is-homepage') === 'true',
  isContactPage: document.body.getAttribute('data-is-contact') === 'true',
  isEventsPage: document.body.getAttribute('data-is-events') === 'true',
  isStudioPage: document.body.getAttribute('data-is-studio') === 'true'
});

(function() {
  logDebug("🔐 ReCAPTCHA handler loading...");
  
  // Form türlerini tanımla
  const FORM_TYPES = {
    homepageForm: 'homepage',
    eventsForm: 'events',
    studioForm: 'studio',
    contactForm: 'contact'
  };
  
  // reCAPTCHA site key
  const SITE_KEY = '6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI';
  
  // Token input değerini güncelle
  function updateTokenValue(input, token) {
    if (input) {
      input.value = token;
      logDebug("✅ Token updated: " + token.substring(0, 10) + "...");
    }
  }
  
  // Doğrudan formları tarayarak işlem yap - daha basit ve güvenilir yaklaşım
  function setupForms() {
    // Sayfa formları bul
    const forms = document.querySelectorAll('form[action="/contact"]');
    
    if (forms.length === 0) {
      logDebug("⚠️ No contact forms found on this page");
      return;
    }
    
    logDebug(`🔍 Found ${forms.length} contact form(s) on this page`);
    
    // Her form için işlem yap
    forms.forEach(form => {
      // Zaten işlendiyse atla
      if (form.getAttribute('data-recaptcha-initialized') === 'true') {
        logDebug(`⏭️ Form ${form.getAttribute('name') || 'unnamed'} already initialized`);
        return;
      }
      
      // Form ismini kontrol et
      const formName = form.getAttribute('name');
      if (!formName || !FORM_TYPES[formName]) {
        logWarn(`⚠️ Form without proper name attribute: ${formName}`);
      } else {
        logDebug(`🔍 Processing ${FORM_TYPES[formName]} form`);
      }
      
      // Token inputu bul
      const tokenInput = form.querySelector('input[name="recaptchaToken"]');
      if (!tokenInput) {
        logError("❌ recaptchaToken input not found in form!");
        return;
      }
      
      // Form submit olayını yakala
      form.addEventListener('submit', function formSubmitHandler(e) {
        // Eğer form zaten gönderildiyse çık
        if (form.dataset.submitting === 'true') {
          logWarn("⚠️ Form already being submitted, preventing duplicate submission");
          e.preventDefault();
          return false;
        }
        
        // Formu "gönderiliyor" olarak işaretle
        form.dataset.submitting = 'true';
        
        // Önce submit'i durdur
        e.preventDefault();
        
        // Form submit butonunu devre dışı bırak
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = 'Sending...';
        }
        
        // Önce eski token'ı temizle
        if (tokenInput) {
          tokenInput.value = '';
        }
        
        logDebug("🔄 Form submit intercepted, generating fresh token...");
        
        // Taze token oluştur
        grecaptcha.ready(function() {
          grecaptcha.execute(SITE_KEY, {action: 'submit'})
            .then(function(token) {
              // Token'ı form'a ekle
              updateTokenValue(tokenInput, token);
              logDebug("📤 Submitting form with fresh token");
              
              // Form verilerini yazdır - sadece debug için
              if (!isProduction) {
                const formData = new FormData(form);
                const formDataObj = {};
                formData.forEach((value, key) => {
                  if (key === 'recaptchaToken') {
                    formDataObj[key] = value.substring(0, 10) + '...';
                  } else {
                    formDataObj[key] = value;
                  }
                });
                console.log('Form data:', formDataObj);
              }
              
              // Formu gerçekten gönder (event listener'ı kaldırarak)
              // Daha uzun bir gecikme ekleyelim (1000ms)
              setTimeout(() => {
                form.removeEventListener('submit', formSubmitHandler);
                form.submit();
              }, 1000); // 500ms'den 1000ms'ye çıkarıldı - timeout hatasını çözmek için
            })
            .catch(function(error) {
              logError("❌ Token generation failed:", error);
              
              // Submit butonunu geri etkinleştir
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Send';
              }
              
              // Form işaretini temizle ki tekrar denenebilsin
              form.dataset.submitting = 'false';
              
              // Kullanıcıya bilgi ver
              alert("Form submission failed. Please try again.");
            });
        });
      });
      
      // İşlendiğini işaretle
      form.setAttribute('data-recaptcha-initialized', 'true');
      
      logDebug(`✅ Submit handler attached to ${formName || 'unnamed'} form`);
    });
  }
  
  // reCAPTCHA yüklenmesini kontrol et ve tekrar dene
  function checkRecaptcha() {
    if (typeof grecaptcha === 'undefined') {
      logWarn("⚠️ reCAPTCHA API not loaded yet, will retry...");
      setTimeout(checkRecaptcha, 500); // 500ms sonra tekrar dene
    } else {
      logDebug("✅ reCAPTCHA API detected");
      setupForms();
    }
  }
  
  // DOM hazır olduğunda sadece bir kez çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // İlk kontrol
      checkRecaptcha();
    });
  } else {
    // İlk kontrol
    checkRecaptcha();
  }
})();