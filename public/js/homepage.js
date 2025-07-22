document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form[action='/']");
  const toggle = document.getElementById("toggle-agreement");
  const toggleError = document.getElementById("toggle-error");
  let submitting = false;

  if (form) {
    form.onsubmit = null;
    form.addEventListener("submit", function(e) {
      if (submitting) return;
      if (toggle && !toggle.checked) {
        if (toggleError) toggleError.classList.remove("hidden");
        e.preventDefault();
        return;
      } else {
        if (toggleError) toggleError.classList.add("hidden");
      }
      e.preventDefault();
      grecaptcha.ready(function() {
        grecaptcha.execute('6Lfk1X0rAAAAABIekRWzhhzOs9yqkXroGTCmhmmI', { action: 'submit' }).then(function(token) {
          document.getElementById('recaptchaToken').value = token;
          submitting = true;
          form.submit();
        });
      });
    });
  }
});
