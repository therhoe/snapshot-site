/* ============================================================
   Card grid + modal.

   Reads data/items.json, renders a card per entry, and opens a
   modal with the full body text when a card is activated.

   Note: fetch() won't work over file:// — the page must be served
   (locally: `python -m http.server`, live: GitHub Pages).
   ============================================================ */

(function () {
  "use strict";

  var root = document.getElementById("grid");
  if (!root) return;

  var modal = document.getElementById("modal");
  var modalHead = modal.querySelector(".modal-head");
  var modalImage = modal.querySelector(".modal-image");
  var modalTitle = modal.querySelector(".modal-title");
  var modalSubtitle = modal.querySelector(".modal-subtitle");
  var modalBody = modal.querySelector(".modal-body");
  var closeButton = modal.querySelector(".modal-close");

  var lastFocused = null;
  var cardElements = [];

  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

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
    // Without an image the head has nothing to sit beside, so the
    // text takes the full width instead of half of it.
    modalHead.classList.toggle("is-textonly", !item.image);

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

  // Groups appear in the order their section name is first seen, so
  // reordering sections means reordering items in the JSON.
  function groupBySection(items) {
    var order = [];
    var bySection = {};

    items.forEach(function (item, index) {
      var name = item.section || "";
      if (!bySection[name]) {
        bySection[name] = [];
        order.push(name);
      }
      bySection[name].push(index);
    });

    return order.map(function (name) {
      return { name: name, indexes: bySection[name] };
    });
  }

  /* ---- questions ----
     Rendered from the same items the cards come from, so a question
     can't end up pointing at a card that was renamed or removed. */

  function revealCard(card) {
    card.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center"
    });

    // preventScroll, or focus() would jump instantly and fight the
    // smooth scroll we just started.
    card.focus({ preventScroll: true });

    clearHighlight();
    card.classList.add("is-highlighted");
  }

  function clearHighlight() {
    cardElements.forEach(function (el) {
      if (el) el.classList.remove("is-highlighted");
    });
  }

  function buildQuestions(items) {
    var list = document.getElementById("questions");
    var section = document.getElementById("questions-section");
    if (!list || !section) return;

    var asked = items
      .map(function (item, index) { return { item: item, index: index }; })
      .filter(function (entry) { return entry.item.question; });

    if (!asked.length) return;

    asked.forEach(function (entry) {
      var li = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "question";
      button.textContent = entry.item.question;
      button.addEventListener("click", function () {
        var card = cardElements[entry.index];
        if (card) revealCard(card);
      });
      li.appendChild(button);
      list.appendChild(li);
    });

    section.hidden = false;
  }

  fetch("data/items.json")
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (items) {
      root.innerHTML = "";
      if (!Array.isArray(items) || !items.length) return;

      var fragment = document.createDocumentFragment();

      groupBySection(items).forEach(function (group, position) {
        if (position > 0) {
          fragment.appendChild(document.createElement("hr")).className =
            "group-divider";
        }

        var section = document.createElement("section");
        section.className = "group";

        if (group.name) {
          var heading = document.createElement("h2");
          heading.className = "group-title";
          heading.textContent = group.name;
          section.appendChild(heading);
        }

        var grid = document.createElement("div");
        grid.className = "grid";
        group.indexes.forEach(function (index) {
          var card = buildCard(items[index], index);
          cardElements[index] = card;
          grid.appendChild(card);
        });

        section.appendChild(grid);
        fragment.appendChild(section);
      });

      root.appendChild(fragment);
      buildQuestions(items);

      root.addEventListener("click", function (e) {
        var card = e.target.closest(".card");
        if (!card) return;
        // The highlight has done its job once the card is opened.
        clearHighlight();
        openModal(items[card.dataset.index], card);
      });
    })
    .catch(function (error) {
      root.innerHTML = "";
      var message = document.createElement("p");
      message.className = "grid-error";
      message.textContent = "Couldn't load items (" + error.message + ").";
      root.appendChild(message);
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
