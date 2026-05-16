(function () {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var navLinks = document.getElementById("nav-links");
  var categoryButton = document.querySelector("[data-category-toggle]");
  var dateBadge = document.querySelector("[data-date-badge]");

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

  if (dateBadge) {
    dateBadge.textContent = new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric"
    }).format(new Date());
  }

  initLaunchNotice();
  initStaticSearch();

  function initLaunchNotice() {
    var modal = document.querySelector("[data-launch-modal]");
    if (!modal) {
      return;
    }

    var buttons = document.querySelectorAll("[data-launch-notice]");
    var closeButton = modal.querySelector("[data-close-launch]");

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener("click", function () {
        modal.classList.add("is-open");
      });
    });

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        modal.classList.remove("is-open");
      });
    }

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.classList.remove("is-open");
      }
    });
  }

  function initStaticSearch() {
    var root = document.querySelector("[data-static-search]");
    if (!root) {
      return;
    }

    var input = root.querySelector("[data-search-input]");
    var status = root.querySelector("[data-search-status]");
    var results = document.querySelector("[data-search-results]");
    var siteUrl = root.getAttribute("data-site-url") || "/";
    var pages = [];
    var loaded = false;

    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        results.innerHTML = "";
        status.textContent = "Type at least two characters to search.";
        return;
      }

      status.textContent = loaded ? "Searching..." : "Building search index...";
      loadIndex().then(function () {
        var matches = pages.filter(function (page) {
          return page.title.toLowerCase().indexOf(query) !== -1 ||
            page.text.toLowerCase().indexOf(query) !== -1;
        }).slice(0, 12);

        renderResults(matches, query);
      }).catch(function () {
        status.textContent = "Search index could not be loaded. Try rendering and publishing again.";
      });
    });

    function loadIndex() {
      if (loaded) {
        return Promise.resolve();
      }

      return fetch(joinUrl(siteUrl, "sitemap.xml"))
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Missing sitemap");
          }
          return response.text();
        })
        .then(function (xmlText) {
          var xml = new DOMParser().parseFromString(xmlText, "application/xml");
          var urls = Array.prototype.slice.call(xml.querySelectorAll("loc"))
            .map(function (node) { return node.textContent; })
            .filter(function (url) {
              return url.indexOf(".xml") === -1 &&
                url.indexOf("/assets/") === -1 &&
                url.indexOf("/media/") === -1;
            })
            .slice(0, 80);

          return Promise.all(urls.map(fetchPage));
        })
        .then(function (items) {
          pages = items.filter(Boolean);
          loaded = true;
          status.textContent = pages.length ? "Search index ready." : "No searchable pages found.";
        });
    }

    function fetchPage(url) {
      return fetch(url)
        .then(function (response) {
          if (!response.ok) {
            return null;
          }
          return response.text().then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            var title = doc.querySelector("h1") ?
              doc.querySelector("h1").textContent.trim() :
              doc.title.replace(/\s*\|.*$/, "").trim();
            var main = doc.querySelector("main");
            return {
              url: url,
              title: title || url,
              text: main ? main.textContent.replace(/\s+/g, " ").trim() : ""
            };
          });
        })
        .catch(function () {
          return null;
        });
    }

    function renderResults(matches, query) {
      if (!matches.length) {
        status.textContent = "No briefs found for \"" + query + "\".";
        results.innerHTML = "";
        return;
      }

      status.textContent = matches.length + " result" + (matches.length === 1 ? "" : "s") + " found.";
      results.innerHTML = matches.map(function (match) {
        var excerpt = makeExcerpt(match.text, query);
        return "<article class=\"search-result\"><a href=\"" + escapeHtml(match.url) + "\">" +
          "<h2>" + escapeHtml(match.title) + "</h2>" +
          "<p>" + escapeHtml(excerpt) + "</p>" +
          "</a></article>";
      }).join("");
    }

    function makeExcerpt(text, query) {
      var lower = text.toLowerCase();
      var index = lower.indexOf(query);
      var start = Math.max(0, index - 70);
      var excerpt = text.slice(start, start + 180);
      return (start > 0 ? "... " : "") + excerpt + (text.length > start + 180 ? " ..." : "");
    }

    function joinUrl(base, path) {
      return base.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#039;"
        }[char];
      });
    }
  }
})();
