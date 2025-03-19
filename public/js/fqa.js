


document.addEventListener("DOMContentLoaded", function () {
  const detailsElements = document.querySelectorAll("details");

  detailsElements.forEach((details) => {
      details.addEventListener("click", function () {
          // Önce tüm details öğelerini kapat
          detailsElements.forEach((item) => {
              if (item !== details) {
                  item.removeAttribute("open");
              }
          });
      });
  });
});