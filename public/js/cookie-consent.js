// Basit logger implementasyonu
const logger = {
  isProduction: window.location.hostname !== 'localhost',
  
  info: function(message) {
    if (!this.isProduction) {
      console.log(`[INFO] Cookie Consent: ${message}`);
    }
  },
  
  warn: function(message) {
    if (!this.isProduction) {
      console.warn(`[WARN] Cookie Consent: ${message}`);
    }
  },
  
  error: function(message, err) {
    // Hata logları her zaman önemli olduğu için production'da da gösteriyoruz
    console.error(`[ERROR] Cookie Consent: ${message}`, err || '');
  }
};

function hasUserMadeChoice() {
  return localStorage.getItem('cookieConsent') !== null;
}

function hasUserAcceptedAnalytics() {
  try {
    const preferences = JSON.parse(localStorage.getItem('cookiePreferences') || '{}');
    return preferences.analytics === true;
  } catch (e) {
    logger.error('Error checking analytics preference', e);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const banner = document.getElementById('cookie-banner');
  const preferencesModal = document.getElementById('cookie-preferences-modal');
  const analyticsCookies = document.getElementById('analytics-cookies');
  
  // İLK SATIR OLARAK EKLENEN - Kullanıcı daha önce analytics'e izin verdiyse etkinleştir
  if (hasUserAcceptedAnalytics()) {
    enableAnalytics();
  }
  
  // Check saved preferences
  try {
    const cookiePreferences = JSON.parse(localStorage.getItem('cookiePreferences') || '{"essential": true, "analytics": false}');
    
    // Set the toggle state based on saved preferences
    if (analyticsCookies) {
      analyticsCookies.checked = cookiePreferences.analytics;
      toggleAnalyticsDot();
    }
  } catch (e) {
    logger.error('Error parsing saved preferences', e);
  }
  
  // Show banner if consent is not given yet
  if (!localStorage.getItem('cookieConsent')) {
    setTimeout(() => {
      if (banner) {
        banner.classList.remove('hidden');
        setTimeout(() => {
          banner.classList.remove('translate-y-full', 'opacity-0');
        }, 10);
      }
    }, 1000);
  }
  
  // Event Listeners
  document.getElementById('cookie-accept')?.addEventListener('click', function() {
    logger.info('User accepted all cookies');
    acceptAllCookies();
    hideBanner();
  });
  
  document.getElementById('cookie-deny')?.addEventListener('click', function() {
    logger.info('User denied non-essential cookies');
    denyAllCookies();
    hideBanner();
  });
  
  document.getElementById('cookie-preferences')?.addEventListener('click', function() {
    logger.info('User opened preferences modal');
    showPreferencesModal();
  });
  
  document.getElementById('close-preferences')?.addEventListener('click', function() {
    logger.info('User closed preferences modal');
    hidePreferencesModal();
  });
  
  document.getElementById('save-preferences')?.addEventListener('click', function() {
    logger.info('User saved custom preferences');
    savePreferences();
    hidePreferencesModal();
    hideBanner();
  });
  
  // Toggle dot for analytics cookies
  document.getElementById('analytics-cookies')?.addEventListener('change', toggleAnalyticsDot);
  
  // Functions
  function toggleAnalyticsDot() {
    const toggleDot = document.querySelector('.toggle-dot');
    if (!toggleDot || !analyticsCookies) return;
    
    if (analyticsCookies.checked) {
      toggleDot.classList.add('translate-x-5');
      analyticsCookies.parentElement.querySelector('label')?.classList.add('bg-[#b5651d]', 'border-[#b5651d]');
      analyticsCookies.parentElement.querySelector('label')?.classList.remove('bg-gray-200', 'border-gray-400');
    } else {
      toggleDot.classList.remove('translate-x-5');
      analyticsCookies.parentElement.querySelector('label')?.classList.remove('bg-[#b5651d]', 'border-[#b5651d]');
      analyticsCookies.parentElement.querySelector('label')?.classList.add('bg-gray-200', 'border-gray-400');
    }
  }
  
  function acceptAllCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      analytics: true
    }));
    enableAnalytics();
  }
  
  function denyAllCookies() {
    localStorage.setItem('cookieConsent', 'denied');
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      analytics: false
    }));
    disableAnalytics();
  }
  
  function savePreferences() {
    if (!analyticsCookies) return;
    
    // Tercihler kaydedildi bildirimi
    const saveBtn = document.getElementById('save-preferences');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.classList.add('bg-green-600');
    saveBtn.classList.remove('bg-[#b5651d]', 'hover:bg-[#a05518]');
    
    // Verileri kaydet
    localStorage.setItem('cookieConsent', 'custom');
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      analytics: analyticsCookies.checked
    }));
    
    logger.info(`User preferences saved: analytics=${analyticsCookies.checked}`);
    
    // Analytics durumunu güncelle
    if (analyticsCookies.checked) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
    
    // Kısa gecikme sonrası modal kapatma
    setTimeout(() => {
      hidePreferencesModal();
      hideBanner();
      
      // Butonu sıfırla (gelecek açılış için)
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.add('bg-[#b5651d]', 'hover:bg-[#a05518]');
        saveBtn.classList.remove('bg-green-600');
      }, 500);
    }, 800);
  }
  
  function showPreferencesModal() {
    if (preferencesModal) {
      preferencesModal.classList.remove('hidden');
    }
  }
  
  function hidePreferencesModal() {
    if (preferencesModal) {
      preferencesModal.classList.add('hidden');
    }
  }
  
  function hideBanner() {
    if (banner) {
      banner.classList.add('translate-y-full', 'opacity-0');
      setTimeout(() => {
        banner.classList.add('hidden');
      }, 300);
    }
  }
  
  // GÜNCELLENMİŞ enableAnalytics
  function enableAnalytics() {
    // Google Analytics veya başka analytics kodunu burada etkinleştir
    logger.info('Analytics enabled');
    
    // Google Analytics örneği:
    try {
      if (typeof ga === 'undefined') {
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        
        ga('create', 'UA-XXXXX-Y', 'auto'); // Kendi tracking ID'nizi buraya ekleyin
        ga('send', 'pageview');
        logger.info('Google Analytics initialized');
      }
    } catch (e) {
      logger.error('Failed to initialize analytics', e);
    }
  }
  
  // GÜNCELLENMİŞ disableAnalytics
  function disableAnalytics() {
    logger.info('Analytics disabled');
    
    try {
      // Google Analytics devre dışı bırakma
      window['ga-disable-UA-XXXXX-Y'] = true; // Kendi tracking ID'nizi buraya ekleyin
      
      // Analytics cookie'lerini sil
      document.cookie = '_ga=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = '_gid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = '_gat=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      logger.info('Analytics cookies removed');
    } catch (e) {
      logger.error('Failed to disable analytics', e);
    }
  }
});

// Footer'daki cookie settings linkini kontrol et
document.addEventListener('DOMContentLoaded', function() {
  const openCookieSettings = document.getElementById('open-cookie-settings');
  if (openCookieSettings) {
    openCookieSettings.addEventListener('click', function(e) {
      e.preventDefault();
      logger.info('Cookie settings opened from footer');
      const preferencesModal = document.getElementById('cookie-preferences-modal');
      if (preferencesModal) {
        preferencesModal.classList.remove('hidden');
      }
      
      // Mevcut tercihleri göster
      const analyticsCookies = document.getElementById('analytics-cookies');
      if (analyticsCookies) {
        try {
          const prefs = JSON.parse(localStorage.getItem('cookiePreferences') || '{"essential":true,"analytics":false}');
          analyticsCookies.checked = prefs.analytics === true;
          logger.info(`Loaded saved preferences: analytics=${prefs.analytics}`);
          
          // Toggle görünümünü güncelle
          const toggleDot = document.querySelector('.toggle-dot');
          if (toggleDot) {
            if (analyticsCookies.checked) {
              toggleDot.classList.add('translate-x-5');
              analyticsCookies.parentElement.querySelector('label')?.classList.add('bg-[#b5651d]', 'border-[#b5651d]');
              analyticsCookies.parentElement.querySelector('label')?.classList.remove('bg-gray-200', 'border-gray-400');
            } else {
              toggleDot.classList.remove('translate-x-5');
              analyticsCookies.parentElement.querySelector('label')?.classList.remove('bg-[#b5651d]', 'border-[#b5651d]');
              analyticsCookies.parentElement.querySelector('label')?.classList.add('bg-gray-200', 'border-gray-400');
            }
          }
        } catch (e) {
          logger.error('Error loading saved preferences', e);
        }
      }
    });
  } else {
    logger.warn('Cookie settings link not found in footer');
  }
});