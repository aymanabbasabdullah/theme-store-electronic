// assets/js/wishlist.js
// --------------------------------------------------
// Global wishlist system
// - localStorage key: ea_wishlist
// - Toggles any [data-wishlist-button]
// - Renders wishlist.html using #wishlist-items / #wishlist-empty

(function () {
  const WISHLIST_KEY = "ea_wishlist";

  // SVGs لحالة زر المفضلة
  const svgOff = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 
    4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 
    4.5 0 010-6.364z"/>
</svg>`;

  const svgOn = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 
    4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 
    4.5 0 010-6.364z"/>
</svg>`;

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
    // حالياً نميّز بالـ id فقط
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

  // -------- UI: زر المفضلة (نفس ستايل صفحة المنتج) --------
  function updateButtonState(btn, inWishlist) {
    if (!btn) return;

    const icon = btn.querySelector(".wishlist-icon");
    const label = btn.querySelector(".wishlist-label");

    if (inWishlist) {
      btn.setAttribute("data-wishlist-state", "on");
      btn.classList.remove(
        "border-slate-300",
        "text-slate-700",
        "bg-white",
        "text-gray-500"
      );
      btn.classList.add(
        "border-pink-400",
        "text-pink-600",
        "bg-pink-50",
        "hover:bg-pink-100"
      );

      if (icon) icon.innerHTML = svgOn;
      if (label) label.textContent = "في المفضلة";
    } else {
      btn.setAttribute("data-wishlist-state", "off");
      btn.classList.remove(
        "border-pink-400",
        "text-pink-600",
        "bg-pink-50",
        "hover:bg-pink-100",
        "text-red-500"
      );
      btn.classList.add(
        "border-slate-300",
        "text-slate-700",
        "bg-white",
        "text-gray-500"
      );

      if (icon) icon.innerHTML = svgOff;
      if (label) label.textContent = "أضف إلى المفضلة";
    }
  }

  function syncButtonsState() {
    const list = getWishlist();
    const ids = list.map((x) => x.id);
    document.querySelectorAll("[data-wishlist-button]").forEach((btn) => {
      const card = btn.closest("[data-product],[data-product-card]");
      const fromCardId =
        card &&
        (card.getAttribute("data-product-id") || card.getAttribute("data-id"));

      const id = btn.getAttribute("data-product-id") || fromCardId || null;

      if (id && ids.includes(id)) {
        // لازم نحدّث data-product-id عشان يبقى ثابت
        btn.setAttribute("data-product-id", id);
        updateButtonState(btn, true);
      } else {
        updateButtonState(btn, false);
      }
    });
  }

  // -------- Wishlist page rendering --------
  function formatPrice(num) {
    const value = Number(num) || 0;
    return `${value.toLocaleString("en-US")} ريال`;
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
        "group relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-2xl transition flex flex-col h-full";
      card.setAttribute("data-product-card", "");
      card.setAttribute("data-product-id", item.id);
      card.setAttribute("data-price", String(item.price || 0));
      card.setAttribute("data-product-name", item.name || "");
      if (item.size) card.setAttribute("data-size", item.size);
      if (item.color) card.setAttribute("data-color", item.color);
      if (item.image) card.setAttribute("data-product-image", item.image);

      const productUrl = `/src/pages/product.html?id=${encodeURIComponent(
        item.id
      )}`;

      card.innerHTML = `
        <!-- Image -->
        <a href="${productUrl}" class="block mt-2">
          <div class="px-3 pt-3">
            <div
              class="aspect-[4/3] rounded-2xl bg-slate-900/5 overflow-hidden flex items-center justify-center relative"
            >
              <div
                class="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.18),transparent_55%)]"
              ></div>
              ${
                item.image
                  ? `<img src="${item.image}" alt="${
                      item.name || ""
                    }" class="relative w-[75%] h-[75%] object-contain rounded-2xl group-hover:scale-105 transition-transform" />`
                  : `<div class="relative w-[75%] h-[75%] bg-[url('https://via.placeholder.com/400x400?text=Product')] bg-center bg-cover rounded-2xl group-hover:scale-105 transition-transform"></div>`
              }
            </div>
          </div>
        </a>

        <!-- Info -->
        <div class="p-4 flex flex-col gap-2 flex-1">
          <a
            href="${productUrl}"
            class="text-sm font-semibold line-clamp-2 hover:text-brand-600"
            data-product-name
          >
            ${item.name || "منتج من قائمة المفضلة"}
          </a>

          <div class="flex items-center justify-between mt-auto pt-1">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] text-slate-400">السعر التقريبي</span>
              <span class="text-base font-bold text-slate-900">
                ${formatPrice(item.price || 0)}
              </span>
            </div>

            
            <div class="flex items-end gap-1">
            <button
                class="inline-flex items-center justify-center rounded-full bg-brand-600 text-white text-[11px] px-4 py-1.5 hover:bg-brand-700"
                data-add-to-cart
                data-product-id="${item.id}"
                data-product-name="${item.name || ""}"
                data-product-price="${item.price || 0}"
                ${item.image ? `data-product-image="${item.image}"` : ""}
              >
                أضف إلى السلة
              </button>
              <button
                class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white text-[11px] px-3 py-1 hover:border-pink-300 hover:text-pink-500 transition"
                data-wishlist-button
                data-product-id="${item.id}"
              >
                <span class="wishlist-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // بعد ما نرسم، نحدّث حالة الأزرار بناءً على localStorage
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
    syncButtonsState(); // يحدّث حالة الأيقونة واللون لو المنتج محفوظ
    renderWishlistPageIfNeeded(); // لو نحن في صفحة wishlist.html يرسم الكروت
  });
})();
