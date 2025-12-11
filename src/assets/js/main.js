// assets/js/main.js

// Global toast helper
window.showToast = function (message, type = "success") {
  // type: 'success' | 'error' | 'info'
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className =
    "rounded-2xl shadow-soft border px-3 py-2.5 text-xs sm:text-sm flex items-start gap-2 bg-white animate-fade-in";

  const colorClasses =
    type === "error"
      ? "border-red-200 text-red-700"
      : type === "info"
      ? "border-blue-200 text-blue-700"
      : "border-emerald-200 text-emerald-700";

  toast.className += " " + colorClasses;

  // Simple icon
  const icon = document.createElement("span");
  icon.className = "mt-0.5";
  icon.innerHTML = type === "error" ? "⚠️" : type === "info" ? "ℹ️" : "✔️";

  const text = document.createElement("p");
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-4px)";
    toast.style.transition = "opacity 150ms ease, transform 150ms ease";
    setTimeout(() => toast.remove(), 200);
  }, 3000);
};

// Mobile menu toggle
(function () {
  const btn = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isHidden = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !isHidden);
  });
})();

// Wishlist basic behavior (stored in localStorage)
(function () {
  const WISHLIST_KEY = "ea-wishlist";
  const btn = document.getElementById("wishlist-button");

  // Ensure key exists
  function initWishlist() {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify([]));
    }
  }

  initWishlist();

  if (btn) {
    btn.addEventListener("click", () => {
      // This is a generic toggle notice; actual add/remove is handled on product cards in product.js
      window.showToast(
        "يمكنك إضافة المنتجات إلى قائمة المفضلة من صفحة المنتج.",
        "info"
      );
    });
  }
})();

// Generic modal handling (for size guide or other modals)
(function () {
  // Open modal buttons: must have [data-modal-target="#modal-id"]
  document.querySelectorAll("[data-modal-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSelector = btn.getAttribute("data-modal-target");
      if (!targetSelector) return;
      const modal = document.querySelector(targetSelector);
      if (modal) {
        modal.classList.remove("hidden");
      }
    });
  });

  // Close modal buttons: must have [data-modal-close]
  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest("[data-modal]");
      if (modal) modal.classList.add("hidden");
    });
  });

  // Close on overlay click
  document.querySelectorAll("[data-modal]").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });
})();

// FAQ accordion (used in faq.html)
(function () {
  // Each question button: [data-accordion-button]
  const buttons = document.querySelectorAll("[data-accordion-button]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panelId = btn.getAttribute("data-accordion-target");
      if (!panelId) return;
      const panel = document.getElementById(panelId);
      if (!panel) return;

      const isOpen = !panel.classList.contains("hidden");
      // Optionally close others
      const group = btn.getAttribute("data-accordion-group");
      if (group) {
        document
          .querySelectorAll(`[data-accordion-group="${group}"]`)
          .forEach((otherBtn) => {
            const otherTarget = otherBtn.getAttribute("data-accordion-target");
            if (!otherTarget) return;
            const otherPanel = document.getElementById(otherTarget);
            if (otherPanel && otherPanel !== panel) {
              otherPanel.classList.add("hidden");
            }
          });
      }

      panel.classList.toggle("hidden", isOpen);
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuBtn = document.getElementById("mobile-menu-toggle");
    const mobileNavPanel = document.getElementById("mobile-nav-panel");

    const mobileSearchBtn = document.getElementById("mobile-search-toggle");
    const mobileSearch = document.getElementById("mobile-search");

    // فتح/إغلاق منيو الموبايل
    if (mobileMenuBtn && mobileNavPanel) {
      mobileMenuBtn.addEventListener("click", function () {
        mobileNavPanel.classList.toggle("hidden");
      });
    }

    // فتح/إغلاق حقل البحث في الموبايل
    if (mobileSearchBtn && mobileSearch) {
      mobileSearchBtn.addEventListener("click", function () {
        mobileSearch.classList.toggle("hidden");
      });
    }
  });

  //  logic active links nav
  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const currentType = params.get("type") || "men"; // default لو ما حددت

    const links = document.querySelectorAll(
      "#main-nav a[href*='category.html'], #mobile-nav-panel a[href*='category.html']"
    );

    links.forEach((link) => {
      const url = new URL(link.href, window.location.origin);
      const linkType = url.searchParams.get("type");

      if (linkType === currentType) {
        link.classList.add(
          "text-gray-900",
          "font-semibold",
          "border-b-2",
          "border-brand-600"
        );
      } else {
        link.classList.remove(
          "text-gray-900",
          "font-semibold",
          "border-b-2",
          "border-brand-600"
        );
      }
    });
  });

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Toast System
  // Toast System
  window.showToast = function (message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) {
      console.warn("Toast container not found!");
      return;
    }

    const toast = document.createElement("div");
    toast.className = `
    p-3 rounded-xl text-sm text-white shadow-md animate-fadeIn
    ${type === "success" ? "bg-green-600" : ""}
    ${type === "error" ? "bg-red-600" : ""}
    ${type === "warning" ? "bg-yellow-600" : ""}
  `;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("animate-fadeOut");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };
})();

//
