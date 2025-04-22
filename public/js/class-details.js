

document.addEventListener("DOMContentLoaded", function () {
  flatpickr("#datePicker", {
    minDate: "today",
    dateFormat: "Y-m-d",
    disableMobile: true
  });
});
