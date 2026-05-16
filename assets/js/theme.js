(function () {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var navLinks = document.getElementById("nav-links");
  var categoryButton = document.querySelector("[data-category-toggle]");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      var label = menuButton.querySelector("span:last-child");
      var icon = menuButton.querySelector(".material-icons");
      if (label) {
        label.textContent = isOpen ? "Close" : "Menu";
      }
      if (icon) {
        icon.textContent = isOpen ? "close" : "menu";
      }
    });
  }

  if (categoryButton) {
    categoryButton.addEventListener("click", function () {
      categoryButton.closest(".nav-dropdown").classList.toggle("is-open");
    });
  }
})();
