/* assets/js/filters.js
 * -------------------------------------------------
 * Filtering & sorting logic for category.html
 */

(function () {
  // ---------------- CONFIG ----------------

  const SELECTORS = {
    productsContainer: "#products-grid",
    productCard: "[data-product]",

    // Filters (buttons + checkboxes)
    filterButtons: "[data-filter]",
    clearFiltersButton: "[data-clear-filters]",
    sortSelect: "#sort-select",
  };

  const PRODUCT_FIELDS = {
    size: "size",
    color: "color",
    price: "price",
    material: "material",
    brand: "brand",
    sale: "sale",
    newestRank: "sortNewest",
    bestsellerRank: "sortBestseller",
  };

  // ---------- In-memory filter state ----------
  const filterState = {
    sizes: new Set(),
    colors: new Set(),
    priceRanges: [],
    brands: new Set(),
    materials: new Set(),
    categories: new Set(),
    features: new Set(),
    saleOnly: false,
  };

  let allProducts = [];
  let productsContainer = null;
  let sortSelect = null;
  let productsBuilt = false; // 👈 حماية من إعادة بناء الكروت

  // ------------- Helpers -------------------

  function toNumber(value, fallback = 0) {
    if (value == null || value === "") return fallback;
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
  }

  function formatPrice(num) {
    return Number(num || 0).toLocaleString("en-US");
  }

  function getCategoryLabelFromCode(code) {
    switch (code) {
      case "mobiles":
        return "جوالات";
      case "laptops":
        return "لابتوبات";
      case "tvs":
        return "شاشات / تلفزيونات";
      case "gaming":
        return "أجهزة ألعاب";
      case "audio":
        return "سماعات وصوتيات";
      case "accessories":
        return "إكسسوارات";
      case "smarthome":
        return "منزل ذكي";
      default:
        return "";
    }
  }

  function getChipsHtmlFromProduct(p) {
    if (!Array.isArray(p.specs)) return "";
    return p.specs
      .slice(0, 3)
      .map((s) => `<span class="chip">${s.value}</span>`)
      .join("");
  }

  function getMainImageFromProduct(p) {
    return (
      (p.images && p.images.main) ||
      "https://via.placeholder.com/500x500?text=Product"
    );
  }

  function getPriceFromProduct(p) {
    if (typeof p.basePrice === "number") return p.basePrice;
    if (Array.isArray(p.variants) && p.variants[0]?.price)
      return p.variants[0].price;
    return 0;
  }

  function getRatingFromProduct(p) {
    return typeof p.rating === "number" ? p.rating : 4.6;
  }

  function getRatingCountFromProduct(p) {
    return typeof p.ratingCount === "number" ? p.ratingCount : 0;
  }

  function isFilterActive(el) {
    if (!el) return false;
    if (el.matches('input[type="checkbox"], input[type="radio"]')) {
      return el.checked;
    }
    if (el.getAttribute("aria-pressed") === "true") return true;
    if (el.classList.contains("active")) return true;
    return false;
  }

  function readFiltersFromDOM() {
    filterState.sizes.clear();
    filterState.colors.clear();
    filterState.priceRanges = [];
    filterState.brands.clear();
    filterState.materials.clear();
    filterState.categories.clear();
    filterState.features.clear();
    filterState.saleOnly = false;

    const filterEls = document.querySelectorAll(SELECTORS.filterButtons);

    filterEls.forEach((el) => {
      const type = el.getAttribute("data-filter");
      if (!type) return;

      const value = (el.value || el.getAttribute("data-value") || "").trim();
      if (!value) return;

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
        case "category":
          filterState.categories.add(value);
          break;
        case "feature":
          filterState.features.add(value.toLowerCase());
          break;
        case "sale":
          filterState.saleOnly = true;
          break;
      }
    });
  }

  function productMatchesFilters(card) {
    const d = card.dataset;

    // category
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

    // features
    if (filterState.features.size > 0) {
      const raw = (d.feature || d.features || "").toLowerCase();
      if (!raw) return false;
      const productFeatures = raw
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      const hasAny = productFeatures.some((f) => filterState.features.has(f));
      if (!hasAny) return false;
    }

    // sale only
    if (filterState.saleOnly) {
      const isOnSale = String(d[PRODUCT_FIELDS.sale]).toLowerCase() === "true";
      if (!isOnSale) return false;
    }

    return true;
  }

  function applyFilters() {
    allProducts.forEach((card) => {
      if (productMatchesFilters(card)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  }

  // --------- Sort helpers ----------

  function compareNewest(a, b) {
    const aRank = toNumber(a.dataset.sortNewest, 0);
    const bRank = toNumber(b.dataset.sortNewest, 0);
    if (aRank !== bRank) return bRank - aRank;

    const aIndex = toNumber(a.dataset.initialIndex, 0);
    const bIndex = toNumber(b.dataset.initialIndex, 0);
    return aIndex - bIndex;
  }

  function compareBestseller(a, b) {
    const aRank = toNumber(a.dataset.sortBestseller, 9999);
    const bRank = toNumber(b.dataset.sortBestseller, 9999);
    if (aRank !== bRank) return aRank - bRank;

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

  function applyFiltersAndSort() {
    readFiltersFromDOM();
    applyFilters();
    applySort();
  }

  function clearAllFilters() {
    document.querySelectorAll("input[data-filter]").forEach((el) => {
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = false;
      }
    });

    document.querySelectorAll("button[data-filter]").forEach((el) => {
      el.classList.remove(
        "active",
        "bg-slate-900",
        "text-white",
        "border-slate-900"
      );
      el.setAttribute("aria-pressed", "false");
    });

    filterState.sizes.clear();
    filterState.colors.clear();
    filterState.priceRanges = [];
    filterState.brands.clear();
    filterState.materials.clear();
    filterState.categories.clear();
    filterState.features.clear();
    filterState.saleOnly = false;

    if (sortSelect) {
      sortSelect.value = "newest";
    }

    applyFiltersAndSort();
  }

  // ------------- Build cards from JSON ----------------

  // async function buildProductsFromJson() {
  //   if (productsBuilt) return; // 👈 لا تعيد البناء لو صارت قبل

  //   const container = document.querySelector(SELECTORS.productsContainer);
  //   if (!container) return;

  //   let data;
  //   try {
  //     const res = await fetch("/src/data/products.json");
  //     if (!res.ok) throw new Error("فشل تحميل ملف المنتجات");
  //     data = await res.json();
  //   } catch (e) {
  //     console.error("خطأ في تحميل ملف المنتجات:", e);
  //     return;
  //   }

  //   container.innerHTML = "";

  //   Object.values(data).forEach((p) => {
  //     const card = document.createElement("div");
  //     card.className =
  //       "group relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-[0_18px_40px_rgba(15,23,42,0.12)] hover:-translate-y-1 hover:shadow-2xl transition overflow-hidden flex flex-col h-full";
  //     card.setAttribute("data-product", "");

  //     if (p.category) card.dataset.category = p.category;
  //     if (p.brand) card.dataset.brand = p.brand;
  //     const price = getPriceFromProduct(p);
  //     card.dataset.price = String(price);

  //     const featuresArr = Array.isArray(p.features) ? p.features : [];
  //     if (featuresArr.length > 0) {
  //       card.dataset.feature = featuresArr.join(",");
  //     }

  //     const hasOffer =
  //       (p.offer && p.offer.hasOffer) || Boolean(p.onSale || p.isOnSale);
  //     if (hasOffer) {
  //       card.dataset.sale = "true";
  //     }

  //     if (p.sortNewest) card.dataset.sortNewest = String(p.sortNewest);
  //     if (p.sortBestseller)
  //       card.dataset.sortBestseller = String(p.sortBestseller);

  //     const img = getMainImageFromProduct(p);
  //     const rating = getRatingFromProduct(p);
  //     const ratingCount = getRatingCountFromProduct(p);
  //     const chipsHtml = getChipsHtmlFromProduct(p);
  //     const categoryLabel =
  //       p.categoryLabel || getCategoryLabelFromCode(p.category);

  //     let topRightBadgeText = "";
  //     let topRightBadgeClass =
  //       "px-2 py-0.5 rounded-full bg-slate-900 text-white";

  //     if (hasOffer && p.offer?.discountPercent) {
  //       topRightBadgeText = `خصم ${p.offer.discountPercent}%`;
  //       topRightBadgeClass =
  //         "px-2 py-0.5 rounded-full bg-red-500/10 text-red-600";
  //     } else if (p.isBestSeller) {
  //       topRightBadgeText = "الأكثر مبيعاً";
  //       topRightBadgeClass =
  //         "px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-700";
  //     } else if (p.isNewArrival) {
  //       topRightBadgeText = "إصدار جديد";
  //       topRightBadgeClass =
  //         "px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700";
  //     }

  //     const innerBadgeText = p.isNewArrival ? "جديد" : "";

  //     const stockText =
  //       p.stockStatus === "out_of_stock"
  //         ? "غير متوفر"
  //         : p.stockStatus === "low_stock"
  //         ? "كمية محدودة"
  //         : "متوفر";

  //     const stockDotClass =
  //       p.stockStatus === "out_of_stock"
  //         ? "bg-red-400"
  //         : p.stockStatus === "low_stock"
  //         ? "bg-amber-400"
  //         : "bg-emerald-400";

  //     const finalPrice = price;
  //     const oldPrice =
  //       typeof p.oldPrice === "number" && p.oldPrice > finalPrice
  //         ? p.oldPrice
  //         : null;

  //     card.innerHTML = `
  //       <!-- Top meta -->
  //       <div class="px-4 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-[1]">
  //         <span class="inline-flex items-center gap-1">
  //           <span class="w-1.5 h-1.5 rounded-full ${stockDotClass}"></span>
  //           ${stockText}
  //         </span>
  //         ${
  //           topRightBadgeText
  //             ? `<span class="${topRightBadgeClass}">${topRightBadgeText}</span>`
  //             : `<span></span>`
  //         }
  //       </div>

  //       <!-- Image -->
  //       <a href="/src/pages/product.html?id=${encodeURIComponent(
  //         p.id
  //       )}" class="block mt-2 relative z-[1]">
  //         <div class="px-4">
  //           <div
  //             class="aspect-[4/3] rounded-2xl bg-slate-900/5 overflow-hidden flex items-center justify-center relative"
  //           >
  //             <div
  //               class="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.22),transparent_55%)]"
  //             ></div>
  //             <div
  //               class="relative w-[75%] h-[75%] bg-[url('${img}')] bg-center bg-cover rounded-2xl group-hover:scale-105 transition-transform"
  //             ></div>
  //             ${
  //               innerBadgeText
  //                 ? `<span
  //                 class="absolute top-3 left-3 rounded-full bg-brand-500 text-white text-[11px] px-2 py-1 shadow-sm"
  //               >
  //                 ${innerBadgeText}
  //               </span>`
  //                 : ""
  //             }
  //           </div>
  //         </div>
  //       </a>

  //       <!-- Info -->
  //       <div class="p-4 flex flex-col gap-2 flex-1 relative z-[1]">
  //         <div class="flex items-center justify-between text-[11px] text-slate-500">
  //           <span>${categoryLabel || ""}</span>
  //           <span class="flex items-center gap-1">
  //             <span class="text-amber-400">★</span>
  //             <span>${rating.toFixed(1)}</span>
  //             ${
  //               ratingCount
  //                 ? `<span class="text-slate-400">(${ratingCount} مراجعة)</span>`
  //                 : ""
  //             }
  //           </span>
  //         </div>

  //         <a
  //           href="/src/pages/product.html?id=${encodeURIComponent(p.id)}"
  //           class="text-sm font-semibold line-clamp-2 hover:text-brand-600"
  //         >
  //           ${p.name || "منتج إلكتروني"}
  //         </a>

  //         <p class="text-[11px] text-slate-500 line-clamp-2">
  //           ${p.shortDescription || ""}
  //         </p>

  //         <div class="flex flex-wrap gap-1.5 mt-1">
  //           ${chipsHtml}
  //         </div>

  //         <div class="mt-auto pt-2 flex items-center justify-between">
  //           <div class="flex flex-col gap-0.5">
  //             <span class="text-[11px] text-slate-400">${
  //               hasOffer ? "السعر بعد الخصم" : "السعر"
  //             }</span>
  //             <div class="flex items-baseline gap-1">
  //               <span class="text-base font-bold ${
  //                 hasOffer ? "text-red-600" : "text-slate-900"
  //               }">
  //                 ${formatPrice(finalPrice)}
  //               </span>
  //               <span class="text-[11px] text-slate-500">ريال</span>
  //             </div>
  //             ${
  //               oldPrice
  //                 ? `<span class="text-[11px] text-slate-400 line-through">
  //                     ${formatPrice(oldPrice)} ريال
  //                   </span>`
  //                 : ""
  //             }
  //           </div>
  //           <div class="flex items-center gap-2">
  //             <button
  //               class="inline-flex items-center justify-center rounded-full bg-brand-600 text-white text-[11px] px-4 py-1.5 hover:bg-brand-700 disabled:opacity-60"
  //               data-add-to-cart
  //               data-product-id="${p.id}"
  //               ${p.stockStatus === "out_of_stock" ? "disabled" : ""}
  //             >
  //               أضف للسلة
  //             </button>
  //             <button
  //               class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-200"
  //               data-wishlist-button
  //               data-product-id="${p.id}"
  //               aria-label="إضافة للمفضلة"
  //             >
  //               ♡
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     `;

  //     container.appendChild(card);
  //   });

  //   productsBuilt = true;
  // }

  // ------------- Build cards from JSON ----------------

  async function buildProductsFromJson() {
    if (window.__categoryProductsBuilt) return; // حماية من إعادة البناء أكثر من مرة
    window.__categoryProductsBuilt = true;

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

    container.innerHTML = "";

    Object.values(data).forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "group relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-[0_18px_40px_rgba(15,23,42,0.12)] hover:-translate-y-1 hover:shadow-2xl transition overflow-hidden flex flex-col h-full";
      card.setAttribute("data-product", "");

      // بيانات أساسية
      const img = getMainImageFromProduct(p);
      const rating = getRatingFromProduct(p);
      const ratingCount = getRatingCountFromProduct(p);
      const chipsHtml = getChipsHtmlFromProduct(p);
      const categoryLabel =
        p.categoryLabel || getCategoryLabelFromCode(p.category);
      const price = getPriceFromProduct(p);
      const finalPrice = price;
      const oldPrice =
        typeof p.oldPrice === "number" && p.oldPrice > finalPrice
          ? p.oldPrice
          : null;

      const hasOffer =
        (p.offer && p.offer.hasOffer) || Boolean(p.onSale || p.isOnSale);

      const stockText =
        p.stockStatus === "out_of_stock"
          ? "غير متوفر"
          : p.stockStatus === "low_stock"
          ? "كمية محدودة"
          : "متوفر";

      const stockDotClass =
        p.stockStatus === "out_of_stock"
          ? "bg-red-400"
          : p.stockStatus === "low_stock"
          ? "bg-amber-400"
          : "bg-emerald-400";

      // بادجات
      let topRightBadgeText = "";
      let topRightBadgeClass =
        "px-2 py-0.5 rounded-full bg-slate-900 text-white";

      if (hasOffer && p.offer?.discountPercent) {
        topRightBadgeText = `خصم ${p.offer.discountPercent}%`;
        topRightBadgeClass =
          "px-2 py-0.5 rounded-full bg-red-500/10 text-red-600";
      } else if (p.isBestSeller) {
        topRightBadgeText = "الأكثر مبيعاً";
        topRightBadgeClass =
          "px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-700";
      } else if (p.isNewArrival) {
        topRightBadgeText = "إصدار جديد";
        topRightBadgeClass =
          "px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700";
      }

      const innerBadgeText = p.isNewArrival ? "جديد" : "";

      // ------------ data-* مهم للـ cart.js / wishlist.js ------------

      // على مستوى الكارد نفسه
      card.dataset.productId = p.id;
      card.dataset.productName = p.name || "منتج إلكتروني";
      card.dataset.productPrice = String(finalPrice);
      card.dataset.productImage = img;
      if (p.category) card.dataset.category = p.category;
      if (p.brand) card.dataset.brand = p.brand;

      const featuresArr = Array.isArray(p.features) ? p.features : [];
      if (featuresArr.length > 0) {
        card.dataset.feature = featuresArr.join(","); // 5g,gaming,...
      }
      if (hasOffer) {
        card.dataset.sale = "true";
      }
      if (p.sortNewest) card.dataset.sortNewest = String(p.sortNewest);
      if (p.sortBestseller)
        card.dataset.sortBestseller = String(p.sortBestseller);

      // ------------- HTML للكارد (ستايل "وصل حديثاً") -------------

      card.innerHTML = `
      <!-- Top meta -->
      <div class="px-4 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-[1]">
        <span class="inline-flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full ${stockDotClass}"></span>
          ${stockText}
        </span>
        ${
          topRightBadgeText
            ? `<span class="${topRightBadgeClass}">${topRightBadgeText}</span>`
            : `<span></span>`
        }
      </div>

      <!-- Image -->
      <a href="/src/pages/product.html?id=${encodeURIComponent(
        p.id
      )}" class="block mt-2 relative z-[1]">
        <div class="px-4">
          <div
            class="aspect-[4/3] rounded-2xl bg-slate-900/5 overflow-hidden flex items-center justify-center relative"
          >
            <div
              class="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(56,189,248,0.22),transparent_55%)]"
            ></div>
            <div
              class="relative w-[75%] h-[75%] bg-[url('${img}')] bg-center bg-cover rounded-2xl group-hover:scale-105 transition-transform"
            ></div>
            ${
              innerBadgeText
                ? `<span
              class="absolute top-3 left-3 rounded-full bg-brand-500 text-white text-[11px] px-2 py-1 shadow-sm"
            >
              ${innerBadgeText}
            </span>`
                : ""
            }
          </div>
        </div>
      </a>

      <!-- Info -->
      <div class="p-4 flex flex-col gap-2 flex-1 relative z-[1]">
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>${categoryLabel || ""}</span>
          <span class="flex items-center gap-1">
            <span class="text-amber-400">★</span>
            <span>${rating.toFixed(1)}</span>
            ${
              ratingCount
                ? `<span class="text-slate-400">(${ratingCount} مراجعة)</span>`
                : ""
            }
          </span>
        </div>

        <a
          href="/src/pages/product.html?id=${encodeURIComponent(p.id)}"
          class="text-sm font-semibold line-clamp-2 hover:text-brand-600"
        >
          ${p.name || "منتج إلكتروني"}
        </a>

        <p class="text-[11px] text-slate-500 line-clamp-2">
          ${p.shortDescription || ""}
        </p>

        <div class="flex flex-wrap gap-1.5 mt-1">
          ${chipsHtml}
        </div>

        <div class="mt-auto pt-2 flex items-center justify-between">
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] text-slate-400">${
              hasOffer ? "السعر بعد الخصم" : "السعر"
            }</span>
            <div class="flex items-baseline gap-1">
              <span class="text-base font-bold ${
                hasOffer ? "text-red-600" : "text-slate-900"
              }">
                ${formatPrice(finalPrice)}
              </span>
              <span class="text-[11px] text-slate-500">ريال</span>
            </div>
            ${
              oldPrice
                ? `<span class="text-[11px] text-slate-400 line-through">
                    ${formatPrice(oldPrice)} ريال
                  </span>`
                : ""
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center justify-center rounded-full bg-brand-600 text-white text-[11px] px-4 py-1.5 hover:bg-brand-700 disabled:opacity-60"
              data-add-to-cart
              data-product-id="${p.id}"
              data-product-name="${(p.name || "منتج إلكتروني").replace(
                /"/g,
                "&quot;"
              )}"
              data-product-price="${finalPrice}"
              data-product-image="${img}"
              ${p.stockStatus === "out_of_stock" ? "disabled" : ""}
            >
              أضف للسلة
            </button>
            <button
              class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-200"
              data-wishlist-button
              data-product-id="${p.id}"
              data-product-name="${(p.name || "منتج إلكتروني").replace(
                /"/g,
                "&quot;"
              )}"
              data-product-price="${finalPrice}"
              data-product-image="${img}"
              aria-label="إضافة للمفضلة"
            >
              ♡
            </button>
          </div>
        </div>
      </div>
    `;

      container.appendChild(card);
    });
  }

  // --------- Init filters & events ----------

  function initFilters() {
    allProducts = Array.from(document.querySelectorAll(SELECTORS.productCard));
    if (!allProducts.length) return;

    productsContainer =
      document.querySelector(SELECTORS.productsContainer) ||
      allProducts[0].parentElement;
    sortSelect = document.querySelector(SELECTORS.sortSelect);

    allProducts.forEach((card, index) => {
      card.dataset.initialIndex = String(index);
    });

    document.querySelectorAll(SELECTORS.filterButtons).forEach((el) => {
      const isInput = el.matches('input[type="checkbox"], input[type="radio"]');

      if (isInput) {
        el.addEventListener("change", applyFiltersAndSort);
      } else {
        el.addEventListener("click", () => {
          const nowActive = !el.classList.contains("active");

          if (nowActive) {
            el.classList.add(
              "active",
              "bg-slate-900",
              "text-white",
              "border-slate-900"
            );
            el.setAttribute("aria-pressed", "true");
          } else {
            el.classList.remove(
              "active",
              "bg-slate-900",
              "text-white",
              "border-slate-900"
            );
            el.setAttribute("aria-pressed", "false");
          }

          applyFiltersAndSort();
        });
      }
    });

    if (sortSelect) {
      sortSelect.addEventListener("change", applyFiltersAndSort);
    }

    const clearBtn = document.querySelector(SELECTORS.clearFiltersButton);
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearAllFilters();
      });
    }

    // تفعيل كاتيجوري من URL لو موجود
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("category");
    if (urlCategory && urlCategory !== "all") {
      document
        .querySelectorAll('button[data-filter="category"]')
        .forEach((btn) => {
          const value = btn.getAttribute("data-value");
          if (value === urlCategory) {
            btn.classList.add(
              "active",
              "bg-slate-900",
              "text-white",
              "border-slate-900"
            );
            btn.setAttribute("aria-pressed", "true");
          } else {
            btn.classList.remove(
              "active",
              "bg-slate-900",
              "text-white",
              "border-slate-900"
            );
            btn.setAttribute("aria-pressed", "false");
          }
        });
    }

    applyFiltersAndSort();

    window.categoryFilters = {
      state: filterState,
      apply: applyFiltersAndSort,
      clear: clearAllFilters,
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await buildProductsFromJson();
    initFilters();
  });
})();
