const redirectUrl = "/";
const manualRedirectLink = document.getElementById('manual-redirect-link');
const countdownElement = document.getElementById('countdown-timer');
let countdown = 5;
manualRedirectLink.href = redirectUrl;
const timerId = setInterval(() => {
  countdown--;
  countdownElement.textContent = countdown;
  if (countdown <= 0) {
    clearInterval(timerId);
    window.location.href = redirectUrl;
  }
}, 1000);