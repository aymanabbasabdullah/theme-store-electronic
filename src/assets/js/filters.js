/* assets/js/filters.js
 * -------------------------------------------------
 * Filtering & sorting logic for category.html
 * (matches the current HTML structure you provided)
 *
 * Product cards:
 *   <div
 *     data-product
 *     data-size="M"
 *     data-color="black"
 *     data-price="199"
 *     data-material="cotton"
 *     data-brand="elegance"
 *     data-sale="true"
 *     data-sort-newest="3"
 *     data-sort-bestseller="1"
 *   >
 *
 * Filters:
 *   buttons (size/color/price) => data-filter="size|color|price" + data-value="..."
 *   checkboxes (material/brand/sale) => input[type=checkbox] data-filter="material|brand|sale"
 *
 * Sort:
 *   <select id="sort-select">
 *     value="newest" | "bestseller" | "price-asc" | "price-desc"
 *   </select>
 */

(function () {
  // ---------------- CONFIG ----------------

  const SELECTORS = {
    productsContainer: "#products-grid",
    productCard: "[data-product]",

    // Filters (by type)
    filterButtons: "[data-filter]", // buttons with data-filter (size, color, price)
    clearFiltersButton: "[data-clear-filters]",
    sortSelect: "#sort-select",
  };

  // Data attributes used on product cards
  const PRODUCT_FIELDS = {
    size: "size",
    color: "color",
    price: "price",
    material: "material",
    brand: "brand",
    sale: "sale",
    newestRank: "sortNewest", // from data-sort-newest
    bestsellerRank: "sortBestseller", // from data-sort-bestseller
  };

  // In-memory filter state
  const filterState = {
    sizes: new Set(),
    colors: new Set(),
    priceRanges: [],
    brands: new Set(),
    materials: new Set(),
    categories: new Set(), // 👈 جديد
    saleOnly: false,
  };

  let allProducts = [];
  let productsContainer = null;
  let sortSelect = null;

  // ------------- Helpers -------------------

  function toNumber(value, fallback = 0) {
    if (value == null || value === "") return fallback;
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
  }

  /**
   * Detect whether a filter UI element is active.
   */
  function isFilterActive(el) {
    if (!el) return false;

    if (el.matches('input[type="checkbox"], input[type="radio"]')) {
      return el.checked;
    }

    if (el.getAttribute("aria-pressed") === "true") return true;
    if (el.classList.contains("active")) return true;

    return false;
  }

  /**
   * Read all filters from DOM into filterState.
   */
  function readFiltersFromDOM() {
    filterState.sizes.clear();
    filterState.colors.clear();
    filterState.priceRanges = [];
    filterState.brands.clear();
    filterState.materials.clear();
    filterState.saleOnly = false;

    // All filter elements (buttons + checkboxes) have data-filter + value/data-value
    const filterEls = document.querySelectorAll(SELECTORS.filterButtons);

    filterEls.forEach((el) => {
      const type = el.getAttribute("data-filter");
      if (!type) return;

      const value = (el.value || el.getAttribute("data-value") || "").trim();
      if (!value) return;

      // Buttons need manual active state; checkboxes use .checked
      const active = isFilterActive(el);
      if (!active) return;

      switch (type) {
        case "size":
          filterState.sizes.add(value);
          break;

        case "color":
          filterState.colors.add(value);
          break;

        case "price": {
          const [minStr, maxStr] = value.split("-");
          const min = minStr ? toNumber(minStr, 0) : 0;
          const max = maxStr ? toNumber(maxStr, Infinity) : Infinity;
          filterState.priceRanges.push({ min, max });
          break;
        }

        case "material":
          filterState.materials.add(value);
          break;

        case "brand":
          filterState.brands.add(value);
          break;

        case "category": // 👈 هذا الجديد
          filterState.categories.add(value);
          break;

        case "sale":
          filterState.saleOnly = true;
          break;
      }
    });
  }

  /**
   * Check if a product card matches current filterState.
   */
  function productMatchesFilters(card) {
    const d = card.dataset;

    // 👈 فلتر الكاتيجوري
    if (filterState.categories.size > 0) {
      const cat = (d.category || "").trim();
      if (!filterState.categories.has(cat)) return false;
    }

    // size
    if (filterState.sizes.size > 0) {
      const productSize = (d[PRODUCT_FIELDS.size] || "").trim();
      if (!filterState.sizes.has(productSize)) return false;
    }
    // color
    if (filterState.colors.size > 0) {
      const productColor = (d[PRODUCT_FIELDS.color] || "").trim();
      if (!filterState.colors.has(productColor)) return false;
    }

    // price
    if (filterState.priceRanges.length > 0) {
      const price = toNumber(d[PRODUCT_FIELDS.price], 0);
      const matchesPrice = filterState.priceRanges.some((range) => {
        return price >= range.min && price <= range.max;
      });
      if (!matchesPrice) return false;
    }

    // material
    if (filterState.materials.size > 0) {
      const material = (d[PRODUCT_FIELDS.material] || "").trim();
      if (!filterState.materials.has(material)) return false;
    }

    // brand
    if (filterState.brands.size > 0) {
      const brand = (d[PRODUCT_FIELDS.brand] || "").trim();
      if (!filterState.brands.has(brand)) return false;
    }

    // sale only
    if (filterState.saleOnly) {
      const isOnSale = String(d[PRODUCT_FIELDS.sale]).toLowerCase() === "true";
      if (!isOnSale) return false;
    }

    return true;
  }

  /**
   * Show/hide cards based on filterState.
   */
  function applyFilters() {
    allProducts.forEach((card) => {
      if (productMatchesFilters(card)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  }

  /**
   * Compare for "newest" sort using data-sort-newest.
   * Higher number = newer (3 is newer than 1).
   */
  function compareNewest(a, b) {
    const aRank = toNumber(a.dataset.sortNewest, 0);
    const bRank = toNumber(b.dataset.sortNewest, 0);
    if (aRank !== bRank) return bRank - aRank; // high -> low (newest first)

    // fallback to original order
    const aIndex = toNumber(a.dataset.initialIndex, 0);
    const bIndex = toNumber(b.dataset.initialIndex, 0);
    return aIndex - bIndex;
  }

  /**
   * Compare for "bestseller" using data-sort-bestseller.
   * Lower number = more sold (1 هو الأكثر مبيعاً).
   */
  function compareBestseller(a, b) {
    const aRank = toNumber(a.dataset.sortBestseller, 9999);
    const bRank = toNumber(b.dataset.sortBestseller, 9999);
    if (aRank !== bRank) return aRank - bRank; // small -> big

    const aIndex = toNumber(a.dataset.initialIndex, 0);
    const bIndex = toNumber(b.dataset.initialIndex, 0);
    return aIndex - bIndex;
  }

  function comparePriceAsc(a, b) {
    const aPrice = toNumber(a.dataset.price, 0);
    const bPrice = toNumber(b.dataset.price, 0);
    if (aPrice !== bPrice) return aPrice - bPrice;

    const aIndex = toNumber(a.dataset.initialIndex, 0);
    const bIndex = toNumber(b.dataset.initialIndex, 0);
    return aIndex - bIndex;
  }

  function comparePriceDesc(a, b) {
    const aPrice = toNumber(a.dataset.price, 0);
    const bPrice = toNumber(b.dataset.price, 0);
    if (aPrice !== bPrice) return bPrice - aPrice;

    const aIndex = toNumber(a.dataset.initialIndex, 0);
    const bIndex = toNumber(b.dataset.initialIndex, 0);
    return aIndex - bIndex;
  }

  /**
   * Sort cards and re-append to container.
   */
  function applySort() {
    if (!productsContainer) return;

    const sortValue = sortSelect ? sortSelect.value : "newest";
    let compareFn = compareNewest;

    switch (sortValue) {
      case "newest":
      case "latest":
        compareFn = compareNewest;
        break;
      case "bestseller":
        compareFn = compareBestseller;
        break;
      case "price-asc":
        compareFn = comparePriceAsc;
        break;
      case "price-desc":
        compareFn = comparePriceDesc;
        break;
      default:
        compareFn = compareNewest;
        break;
    }

    const sorted = [...allProducts].sort(compareFn);
    sorted.forEach((card) => productsContainer.appendChild(card));
  }

  /**
   * Apply filters THEN sort.
   */
  function applyFiltersAndSort() {
    readFiltersFromDOM();
    applyFilters();
    applySort();
  }

  /**
   * Clear all filters UI + state.
   */
  function clearAllFilters() {
    // 1) Clear checkboxes / radio
    document.querySelectorAll("input[data-filter]").forEach((el) => {
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = false;
      }
    });

    // 2) Clear button active styles
    document.querySelectorAll("button[data-filter]").forEach((el) => {
      el.classList.remove(
        "active",
        "bg-gray-900",
        "text-white",
        "border-gray-900"
      );
      el.setAttribute("aria-pressed", "false");
    });

    // 3) Reset state
    filterState.sizes.clear();
    filterState.colors.clear();
    filterState.priceRanges = [];
    filterState.brands.clear();
    filterState.materials.clear();
    filterState.saleOnly = false;

    // 4) Reset sort to newest
    if (sortSelect) {
      sortSelect.value = "newest";
    }

    applyFiltersAndSort();
  }

  // ------------- Init & Events ----------------

  async function buildProductsFromJson() {
    const container = document.querySelector(SELECTORS.productsContainer);
    if (!container) return;

    let data;
    try {
      const res = await fetch("/src/data/products.json");
      if (!res.ok) throw new Error("فشل تحميل ملف المنتجات");
      data = await res.json();
    } catch (e) {
      console.error("خطأ في تحميل ملف المنتجات:", e);
      return;
    }

    // تنظيف الشبكة
    container.innerHTML = "";

    // لو ملف المنتجات من نوع { "1": {...}, "2": {...} }
    Object.values(data).forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group";

      // data-attributes عشان الفلاتر تشتغل
      card.setAttribute("data-product", "");
      if (p.category) card.dataset.category = p.category;
      if (p.brand) card.dataset.brand = p.brand;
      if (p.basePrice) card.dataset.price = String(p.basePrice);
      if (p.features) card.dataset.feature = p.features.join(","); // لو تبغى تستخدمها
      if (p.onSale) card.dataset.sale = "true";
      if (p.sortNewest) card.dataset.sortNewest = String(p.sortNewest);
      if (p.sortBestseller)
        card.dataset.sortBestseller = String(p.sortBestseller);

      // اللينك إلى صفحة المنتج
      const link = document.createElement("a");
      link.href = `/src/pages/product.html?id=${encodeURIComponent(p.id)}`;
      link.className = "block relative";

      const imgWrap = document.createElement("div");
      imgWrap.className = "aspect-[3/4] bg-slate-100";
      imgWrap.innerHTML = `
      <div
        class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
        style="background-image:url('${p.images?.main || ""}')"
      ></div>
    `;

      link.appendChild(imgWrap);
      card.appendChild(link);

      const body = document.createElement("div");
      body.className = "p-3 space-y-1 text-xs";

      const name = document.createElement("p");
      name.className = "text-slate-500";
      name.textContent = p.name || "منتج";

      const short = document.createElement("p");
      short.className = "text-[11px] text-slate-500";
      short.textContent = p.shortDescription || "";

      const bottom = document.createElement("div");
      bottom.className = "flex items-center justify-between mt-1";

      const priceWrap = document.createElement("div");
      priceWrap.className = "flex items-baseline gap-1";

      const priceSpan = document.createElement("span");
      priceSpan.className = p.oldPrice
        ? "font-bold text-red-600"
        : "font-bold text-brand-600";
      priceSpan.textContent =
        (p.basePrice || 0).toLocaleString("en-US") + " ريال";

      priceWrap.appendChild(priceSpan);

      if (p.oldPrice && p.oldPrice > p.basePrice) {
        const oldSpan = document.createElement("span");
        oldSpan.className = "line-through text-slate-400 text-[11px]";
        oldSpan.textContent = p.oldPrice.toLocaleString("en-US") + " ريال";
        priceWrap.appendChild(oldSpan);
      }

      const wishBtn = document.createElement("button");
      wishBtn.className = "text-xs text-slate-500 hover:text-pink-500";
      wishBtn.setAttribute("data-wishlist-button", "true");
      wishBtn.textContent = "♡";

      bottom.appendChild(priceWrap);
      bottom.appendChild(wishBtn);

      body.appendChild(name);
      body.appendChild(short);
      body.appendChild(bottom);

      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function initFilters() {
    allProducts = Array.from(document.querySelectorAll(SELECTORS.productCard));
    if (!allProducts.length) return; // not on category page

    productsContainer =
      document.querySelector(SELECTORS.productsContainer) ||
      allProducts[0].parentElement;
    sortSelect = document.querySelector(SELECTORS.sortSelect);

    // Save original order index
    allProducts.forEach((card, index) => {
      card.dataset.initialIndex = String(index);
    });

    // Buttons (size/color/price) & checkboxes (material/brand/sale)
    document.querySelectorAll(SELECTORS.filterButtons).forEach((el) => {
      const isInput = el.matches('input[type="checkbox"], input[type="radio"]');

      if (isInput) {
        el.addEventListener("change", applyFiltersAndSort);
      } else {
        // Buttons: toggle active state + Tailwind classes
        el.addEventListener("click", () => {
          const nowActive = !el.classList.contains("active");

          if (nowActive) {
            el.classList.add(
              "active",
              "bg-gray-900",
              "text-white",
              "border-gray-900"
            );
            el.setAttribute("aria-pressed", "true");
          } else {
            el.classList.remove(
              "active",
              "bg-gray-900",
              "text-white",
              "border-gray-900"
            );
            el.setAttribute("aria-pressed", "false");
          }

          applyFiltersAndSort();
        });
      }
    });

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener("change", applyFiltersAndSort);
    }

    // Clear filters button
    const clearBtn = document.querySelector(SELECTORS.clearFiltersButton);
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearAllFilters();
      });
    }

    // First run
    applyFiltersAndSort();

    // Expose small debug API (optional)
    window.categoryFilters = {
      state: filterState,
      apply: applyFiltersAndSort,
      clear: clearAllFilters,
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await buildProductsFromJson(); // 👈 نبني الكروت من JSON
    initFilters(); // 👈 بعدين نفعّل الفلاتر والفرز
  });
})();

// كرت المنتج: data-product ✅

// الفلاتر: data-filter="size|color|price|material|brand|sale" ✅

// قيم الفرز: newest / bestseller / price-asc / price-desc ✅

// حاوية المنتجات: id="products-grid" ✅

// زر "مسح الكل": data-clear-filters ✅
