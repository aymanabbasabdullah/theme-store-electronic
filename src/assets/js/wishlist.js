// assets/js/wishlist.js
// --------------------------------------------------
// Global wishlist system
// - localStorage key: ea_wishlist
// - Toggles any [data-wishlist-button]
// - Renders wishlist.html using #wishlist-items / #wishlist-empty

(function () {
  const WISHLIST_KEY = "ea_wishlist";

  // -------- Helpers: storage --------
  function getRawWishlist() {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data;
    } catch (e) {
      console.warn("Wishlist: failed to parse data", e);
      return [];
    }
  }

  function normalizeWishlist(raw) {
    // نقبل شكلين:
    // - مصفوفة IDs: ["prod-1", "prod-2"]
    // - مصفوفة كائنات: [{id, name, price, image, size, color}, ...]
    if (!Array.isArray(raw)) return [];

    if (raw.length === 0) return [];

    if (typeof raw[0] === "string") {
      return raw.map((id) => ({
        id,
        name: "",
        price: 0,
        image: "",
        size: "",
        color: "",
      }));
    }

    return raw.map((item) => ({
      id: item.id || "",
      name: item.name || "",
      price: Number(item.price) || 0,
      image: item.image || "",
      size: item.size || "",
      color: item.color || "",
    }));
  }

  function getWishlist() {
    return normalizeWishlist(getRawWishlist());
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Wishlist: failed to save", e);
    }
  }

  function isSameItem(a, b) {
    // نميّز فقط بـ id حالياً
    return a.id === b.id;
  }

  function findIndexInWishlist(list, item) {
    return list.findIndex((x) => isSameItem(x, item));
  }

  // -------- Toast helper --------
  function showToast(msg, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
      return;
    }
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-message");
    if (!toast || !msgEl) {
      alert(msg);
      return;
    }
    msgEl.textContent = msg;
    toast.classList.remove("hidden");
    toast.classList.add("flex");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("flex");
    }, 2500);
  }

  // -------- Core logic: toggle / remove --------
  function extractProductDataFromButton(btn) {
    // نحاول نقرأ من الزر أولاً
    const id = btn.getAttribute("data-product-id") || "product-" + Date.now();

    let name = btn.getAttribute("data-product-name") || "";

    let price = parseFloat(btn.getAttribute("data-product-price") || "0") || 0;
    let image = btn.getAttribute("data-product-image") || "";
    let size = btn.getAttribute("data-product-size") || "";
    let color = btn.getAttribute("data-product-color") || "";

    // لو ناقصة بيانات نحاول نقرأ من الكرت الأقرب
    const card = btn.closest("[data-product], [data-product-card]");
    if (card) {
      if (!name) {
        name = card.getAttribute("data-product-name") || "";
        if (!name) {
          const nameEl = card.querySelector("[data-product-name]");
          if (nameEl) name = nameEl.textContent.trim();
        }
      }
      if (!price) {
        price = parseFloat(card.getAttribute("data-price") || "0") || 0;
      }
      if (!image) {
        image = card.getAttribute("data-product-image") || "";
        if (!image) {
          const imgEl = card.querySelector("img");
          if (imgEl && imgEl.src) image = imgEl.src;
        }
      }
      if (!size) {
        size =
          card.getAttribute("data-size-selected") ||
          card.getAttribute("data-size") ||
          "";
      }
      if (!color) {
        color =
          card.getAttribute("data-color-selected") ||
          card.getAttribute("data-color") ||
          "";
      }
    }

    return { id, name, price, image, size, color };
  }

  function toggleWishlist(btn) {
    const item = extractProductDataFromButton(btn);
    let list = getWishlist();
    const index = findIndexInWishlist(list, item);

    let isNowFav = false;

    if (index === -1) {
      list.push(item);
      isNowFav = true;
      showToast("تمت إضافة المنتج إلى المفضلة.", "success");
    } else {
      list.splice(index, 1);
      isNowFav = false;
      showToast("تمت إزالة المنتج من المفضلة.", "info");
    }

    saveWishlist(list);
    updateButtonState(btn, isNowFav);
    renderWishlistPageIfNeeded(); // لو نحن في wishlist.html
  }

function updateButtonState(btn, active) {
  const labelSpan = btn.querySelector(".wishlist-label");

  if (active) {
    btn.classList.add("text-red-500");
    btn.classList.remove("text-gray-500");
    if (labelSpan) labelSpan.textContent = "تمت الاضافة المفضلة";
    btn.setAttribute("aria-pressed", "true");
  } else {
    btn.classList.remove("text-red-500");
    btn.classList.add("text-gray-500");
    if (labelSpan) labelSpan.textContent = "أضف إلى المفضلة";
    btn.setAttribute("aria-pressed", "false");
  }
}


  function syncButtonsState() {
    const list = getWishlist();
    const ids = list.map((x) => x.id);
    document.querySelectorAll("[data-wishlist-button]").forEach((btn) => {
      const id =
        btn.getAttribute("data-product-id") ||
        (btn.closest("[data-product],[data-product-card]") &&
          (btn
            .closest("[data-product],[data-product-card]")
            .getAttribute("data-product-id") ||
            btn
              .closest("[data-product],[data-product-card]")
              .getAttribute("data-id"))) ||
        null;

      if (id && ids.includes(id)) {
        updateButtonState(btn, true);
      } else {
        updateButtonState(btn, false);
      }
    });
  }

  // -------- Wishlist page rendering --------
  function formatPrice(num) {
    const value = Number(num) || 0;
    return `${value.toFixed(0)} ريال`;
  }

  function renderWishlistPageIfNeeded() {
    const container = document.getElementById("wishlist-items");
    const emptyState = document.getElementById("wishlist-empty");
    if (!container || !emptyState) return; // لسنا في صفحة المفضلة

    const list = getWishlist();
    container.innerHTML = "";

    if (list.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group";
      card.setAttribute("data-product-card", "");
      card.setAttribute("data-product-id", item.id);
      card.setAttribute("data-price", String(item.price || 0));
      card.setAttribute("data-product-name", item.name || "");
      if (item.size) card.setAttribute("data-size", item.size);
      if (item.color) card.setAttribute("data-color", item.color);
      if (item.image) card.setAttribute("data-product-image", item.image);

      card.innerHTML = `
        <a href="product.html" class="block relative">
          <div class="aspect-[3/4] bg-gray-100">
            ${
              item.image
                ? `<img src="${item.image}" alt="${
                    item.name || ""
                  }" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full bg-[url('https://via.placeholder.com/400x500')] bg-cover bg-center"></div>`
            }
          </div>
        </a>
        <div class="p-3 space-y-1 text-xs">
          <p class="text-gray-600 truncate" data-product-name>
            ${item.name || "منتج من قائمة المفضلة"}
          </p>
          <div class="flex items-center justify-between mt-1">
            <span class="font-bold">${formatPrice(item.price || 0)}</span>
            <div class="flex items-center gap-1">
              <button
                class="text-xs text-gray-500 hover:text-red-500"
                data-wishlist-button
                data-product-id="${item.id}"
              >
                ♥
              </button>
              <button
                class="text-xs text-gray-700 hover:text-brand-600"
                data-add-to-cart
                data-product-id="${item.id}"
                data-product-name="${item.name || ""}"
                data-product-price="${item.price || 0}"
                ${item.image ? `data-product-image="${item.image}"` : ""}
              >
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // بعد ما نرسم، نحدّث حالة الأزرار
    syncButtonsState();
  }

  // -------- Global events --------
  function initWishlistButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wishlist-button]");
      if (!btn) return;
      e.preventDefault();
      toggleWishlist(btn);
    });
  }

  // -------- Public API --------
  const WishlistAPI = {
    getWishlist,
    saveWishlist,
    render: renderWishlistPageIfNeeded,
    syncButtons: syncButtonsState,
  };

  window.Wishlist = WishlistAPI;

  // -------- Init on DOM ready --------
  document.addEventListener("DOMContentLoaded", () => {
    initWishlistButtons();
    syncButtonsState();
    renderWishlistPageIfNeeded();
  });
})();
