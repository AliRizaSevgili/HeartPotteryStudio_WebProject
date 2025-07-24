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
  
  // Sayfa yüklendiğinde başlangıç tokenını oluştur
  function generateInitialToken(tokenInput) {
    logDebug("🔄 Generating initial token...");
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.ready === 'function') {
      grecaptcha.ready(function() {
        grecaptcha.execute(SITE_KEY, {action: 'submit'})
          .then(function(token) {
            updateTokenValue(tokenInput, token);
            logDebug("🔑 Initial token generated successfully");
          })
          .catch(function(error) {
            logError("❌ Initial token generation failed:", error);
          });
      });
    } else {
      logError("❌ grecaptcha not available for initial token");
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
      
      // *** YENİ: Başlangıç tokenını oluştur ***
      generateInitialToken(tokenInput);
      
      // Form submit olayını yakala
      form.addEventListener('submit', function(e) {
        // Önce submit'i durdur
        e.preventDefault();
        logDebug("🔄 Form submit intercepted, generating fresh token...");
        
        // Taze token oluştur
        grecaptcha.ready(function() {
          grecaptcha.execute(SITE_KEY, {action: 'submit'})
            .then(function(token) {
              // Token'ı form'a ekle
              updateTokenValue(tokenInput, token);
              logDebug("📤 Submitting form with fresh token");
              
              // Formu gerçekten gönder
              form.removeEventListener('submit', arguments.callee);
              setTimeout(() => form.submit(), 100);
            })
            .catch(function(error) {
              logError("❌ Token generation failed:", error);
              // Hata olsa da formu gönder
              form.submit();
            });
        });
      });
      
      logDebug(`✅ Submit handler attached to ${formName || 'unnamed'} form`);
    });
  }
  
  // DOM hazır olduğunda çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupForms);
  } else {
    setupForms();
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
  
  // İlk kontrol
  checkRecaptcha();
})();