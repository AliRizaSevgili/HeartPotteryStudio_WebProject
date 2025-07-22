document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form[action='/contact']");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");
  
  if (form) {
    form.onsubmit = null;
    form.addEventListener("submit", function(e) {
      // Önce toggle kontrolü
      if (toggle && !toggle.checked) {
        if (toggleError) toggleError.classList.remove("hidden");
        e.preventDefault();
        return;
      } else {
        if (toggleError) toggleError.classList.add("hidden");
      }
      e.preventDefault();
      grecaptcha.ready(function() {
        grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', {action: 'submit'}).then(function(token) {
          document.getElementById('recaptchaToken').value = token;
          form.submit();
        });
      });
    });
  }
});
