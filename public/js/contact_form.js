document.addEventListener("DOMContentLoaded", () => {
  const contactNumber = document.getElementById("contactNumber");

  if (contactNumber) {
    contactNumber.addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/[^+\d\s-]/g, '');
    });
  }
});



// JS ile toggle hareketi
document.querySelector('[role="switch"]').addEventListener('click', function () {
  const isChecked = this.getAttribute('aria-checked') === 'true';
  this.setAttribute('aria-checked', String(!isChecked));
  this.querySelector('span[aria-hidden="true"]').classList.toggle('translate-x-3.5');
  this.querySelector('span[aria-hidden="true"]').classList.toggle('translate-x-0');
});
