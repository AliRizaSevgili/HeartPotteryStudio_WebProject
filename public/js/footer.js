document.addEventListener("DOMContentLoaded", function () {
  const footer = document.getElementById("hidden-footer");
  
  if (!footer) {
      console.error("Footer elementi bulunamadı.");
      return;
  }
  
  window.addEventListener("scroll", function () {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= documentHeight - 10) {
          
          footer.classList.remove("opacity-0");
          footer.classList.add("opacity-100");
      } else {
          
          footer.classList.remove("opacity-100");
          footer.classList.add("opacity-0");
      }
  });
});
