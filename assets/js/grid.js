/* ============================================================
   Card grid + modal.

   Reads data/items.json, renders a card per entry, and opens a
   modal with the full body text when a card is activated.

   Note: fetch() won't work over file:// — the page must be served
   (locally: `python -m http.server`, live: GitHub Pages).
   ============================================================ */

(function () {
  "use strict";

  var grid = document.getElementById("grid");
  if (!grid) return;

  var modal = document.getElementById("modal");
  var modalImage = modal.querySelector(".modal-image");
  var modalTitle = modal.querySelector(".modal-title");
  var modalSubtitle = modal.querySelector(".modal-subtitle");
  var modalBody = modal.querySelector(".modal-body");
  var closeButton = modal.querySelector(".modal-close");

  var lastFocused = null;

  /* ---- render ---- */

  function buildCard(item, index) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.index = index;

    var figure = document.createElement("span");
    figure.className = "card-image";
    if (item.image) {
      var img = document.createElement("img");
      img.src = item.image;
      img.alt = "";
      img.loading = "lazy";
      figure.appendChild(img);
    }
    card.appendChild(figure);

    var title = document.createElement("span");
    title.className = "card-title";
    title.textContent = item.title || "";
    card.appendChild(title);

    if (item.subtitle) {
      var subtitle = document.createElement("span");
      subtitle.className = "card-subtitle";
      subtitle.textContent = item.subtitle;
      card.appendChild(subtitle);
    }

    return card;
  }

  /* ---- modal ---- */

  function openModal(item, trigger) {
    lastFocused = trigger;

    modalImage.innerHTML = "";
    if (item.image) {
      var img = document.createElement("img");
      img.src = item.image;
      img.alt = "";
      modalImage.appendChild(img);
      modalImage.hidden = false;
    } else {
      modalImage.hidden = true;
    }

    modalTitle.textContent = item.title || "";

    modalSubtitle.textContent = item.subtitle || "";
    modalSubtitle.hidden = !item.subtitle;

    // Blank lines in the JSON become separate paragraphs.
    modalBody.innerHTML = "";
    String(item.body || "")
      .split(/\n\s*\n/)
      .filter(function (para) { return para.trim(); })
      .forEach(function (para) {
        var p = document.createElement("p");
        p.textContent = para.trim();
        modalBody.appendChild(p);
      });

    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
    lastFocused = null;
  }

  // Keep tabbing inside the dialog while it's open.
  function trapFocus(e) {
    if (e.key !== "Tab") return;

    var focusable = modal.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---- load ---- */

  fetch("data/items.json")
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (items) {
      if (!Array.isArray(items) || !items.length) {
        grid.innerHTML = "";
        return;
      }

      var fragment = document.createDocumentFragment();
      items.forEach(function (item, index) {
        fragment.appendChild(buildCard(item, index));
      });

      grid.innerHTML = "";
      grid.appendChild(fragment);

      grid.addEventListener("click", function (e) {
        var card = e.target.closest(".card");
        if (card) openModal(items[card.dataset.index], card);
      });
    })
    .catch(function (error) {
      grid.innerHTML = "";
      var message = document.createElement("p");
      message.className = "grid-error";
      message.textContent = "Couldn't load items (" + error.message + ").";
      grid.appendChild(message);
    });

  /* ---- close handlers ---- */

  closeButton.addEventListener("click", closeModal);

  // Click the backdrop, but not the panel itself.
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    trapFocus(e);
  });
})();
