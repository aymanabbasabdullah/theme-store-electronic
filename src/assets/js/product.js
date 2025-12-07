// assets/js/product.js
// صفحة منتج ديناميكية تعتمد على JSON واحد: #product-data

document.addEventListener("DOMContentLoaded", async () => {
  // ---------- قراءة JSON ----------
  // let productData = null;
  // try {
  //   const script = document.getElementById("product-data");
  //   if (script) {
  //     const json = script.textContent || "{}";
  //     productData = JSON.parse(json);
  //   }
  // } catch (e) {
  //   console.error("خطأ في JSON الخاص بالمنتج:", e);
  //   return;
  // }
  // if (!productData) return;
  // let productData = null;

  // try {
  //   // 1) نجيب كل المنتجات من ملف JSON
  //   const res = await fetch("/src/data/products.json");
  //   if (!res.ok) {
  //     throw new Error("فشل تحميل ملف المنتجات");
  //   }

  //   const allProducts = await res.json();

  //   // 2) نقرأ id من الـ URL
  //   const params = new URLSearchParams(window.location.search);
  //   const idFromUrl = params.get("id") || "1"; // غيّر "1" للإفتراضي اللي تريده

  //   // 3) نختار المنتج الموافق
  //   productData = allProducts[idFromUrl];

  //   if (!productData) {
  //     console.error("لم يتم العثور على منتج لهذا الـ id:", idFromUrl);
  //     return;
  //   }
  // } catch (e) {
  //   console.error("خطأ في تحميل JSON الخاص بالمنتجات:", e);
  //   return;
  // }

  let productData = null;

  try {
    const res = await fetch("/src/data/products.json");
    if (!res.ok) throw new Error("فشل تحميل ملف المنتجات");
    const allProducts = await res.json();

    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id") || "1"; // أو "phone-001" حسب JSON حقك

    productData = allProducts[idFromUrl];
    if (!productData) {
      console.error("لم يتم العثور على بيانات المنتج لهذا الـ id", idFromUrl);
      return;
    }
  } catch (e) {
    console.error("خطأ في JSON الخاص بالمنتج:", e);
    return;
  }
  const variants = productData.variants || [];
  let currentVariant = null;
  const selectedAttrs = {}; // تتعبّى بالاختيارات

  // ---------- Helpers ----------
  function formatPrice(num) {
    if (typeof num !== "number") return "";
    try {
      return (
        num.toLocaleString("en-US") + " " + (productData.currency || "ريال")
      );
    } catch {
      return num + " " + (productData.currency || "ريال");
    }
  }

  function createEl(tag, className, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      el.setAttribute(k, v);
    });
    return el;
  }

  // ---------- حقول أساسية من الـ DOM ----------
  const mainImageEl = document.getElementById("main-product-image");
  const thumbsContainer = document.getElementById("product-thumbs");
  const titleEl = document.querySelector("[data-product-title]");
  const shortDescEl = document.querySelector("[data-product-short-desc]");
  const longDescEl = document.querySelector("[data-product-long-desc]");
  const priceEl = document.querySelector("[data-product-price-current]");
  const oldPriceEl = document.querySelector("[data-product-price-old]");
  const discountBadgeEl = document.getElementById("discount-badge");
  const stockBadgeEl = document.getElementById("stock-badge");
  const offerTimerWrapper = document.getElementById("offer-timer-wrapper");
  const countdownEl = document.getElementById("countdown-timer");
  const specsListEl = document.getElementById("product-specs-list");
  const optionsContainer = document.getElementById("product-options-container");
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  const qtyInput = document.getElementById("quantity-input");
  const accessoriesSection = document.getElementById(
    "product-accessories-section"
  );
  const accessoriesContainer = document.getElementById("product-accessories");
  const relatedSection = document.getElementById("product-related-section");
  const relatedContainer = document.getElementById("product-related");

  const breadcrumbCategoryEl = document.querySelector(
    "[data-breadcrumb-category]"
  );
  const breadcrumbCategoryLink = document.querySelector(
    "[data-breadcrumb-category-link]"
  );
  const breadcrumbNameEl = document.querySelector("[data-breadcrumb-name]");

  const ratingTextEl = document.getElementById("rating-text");
  const ratingCountEl = document.getElementById("rating-count");

  const wishlistButtons = document.querySelectorAll("[data-wishlist-button]");

  // ---------- تطبيق بيانات أساسية ----------
  document.title = productData.name + " - متجر التقنية";

  if (titleEl) titleEl.textContent = productData.name || "منتج بدون اسم";

  if (shortDescEl) shortDescEl.textContent = productData.shortDescription || "";
  if (longDescEl) longDescEl.textContent = productData.longDescription || "";

  if (breadcrumbCategoryEl) {
    breadcrumbCategoryEl.textContent =
      productData.categoryLabel || productData.category || "منتجات";
  }
  if (breadcrumbCategoryLink && productData.category) {
    breadcrumbCategoryLink.href = `/src/pages/category.html?category=${encodeURIComponent(
      productData.category
    )}`;
  }
  if (breadcrumbNameEl) breadcrumbNameEl.textContent = productData.name || "";

  if (ratingTextEl && typeof productData.rating === "number") {
    ratingTextEl.textContent = `${productData.rating} من 5`;
  }
  if (ratingCountEl && typeof productData.ratingCount === "number") {
    ratingCountEl.textContent = `(${productData.ratingCount} تقييم)`;
  }

  // ---------- معرض الصور ----------
  const gallery = (productData.images && productData.images.gallery) || [];
  const mainSrc =
    productData.images?.main ||
    gallery.find((g) => g.isDefault)?.src ||
    (gallery[0] && gallery[0].src) ||
    "";

  if (mainImageEl && mainSrc) {
    mainImageEl.src = mainSrc;
    mainImageEl.alt = productData.name || "";
  }

  if (thumbsContainer && gallery.length) {
    thumbsContainer.innerHTML = "";
    gallery.forEach((img, idx) => {
      const btn = createEl(
        "button",
        "aspect-square rounded-xl overflow-hidden border " +
          (idx === 0
            ? "border-brand-500 ring-2 ring-offset-2"
            : "border-transparent hover:border-brand-500"),
        {
          "data-product-thumb": "true",
          "data-image": img.src || "",
        }
      );
      const imageEl = createEl("img", "w-full h-full object-cover", {
        src: img.thumb || img.src || "",
        alt: img.alt || productData.name || "",
      });
      btn.appendChild(imageEl);
      thumbsContainer.appendChild(btn);
    });
  }

  // بعد ما صنعنا الصور، نفعّل السلوك
  const thumbButtons = document.querySelectorAll("[data-product-thumb]");
  if (mainImageEl && thumbButtons.length > 0) {
    thumbButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-image");
        if (src) mainImageEl.setAttribute("src", src);
        thumbButtons.forEach((b) =>
          b.classList.remove("border-brand-500", "ring-2", "ring-offset-2")
        );
        btn.classList.add("border-brand-500", "ring-2", "ring-offset-2");
      });
    });
  }

  // ---------- السعر / الخصم ----------
  let basePrice = productData.basePrice || 0;
  let baseOldPrice = productData.oldPrice || 0;

  function updatePriceDisplay(newPrice, newOldPrice) {
    const p =
      typeof newPrice === "number" && newPrice > 0 ? newPrice : basePrice;
    const op =
      typeof newOldPrice === "number" && newOldPrice > p
        ? newOldPrice
        : baseOldPrice;

    if (priceEl) priceEl.textContent = formatPrice(p);

    if (oldPriceEl) {
      if (op && op > p) {
        oldPriceEl.textContent = formatPrice(op);
        oldPriceEl.classList.remove("hidden");
      } else {
        oldPriceEl.classList.add("hidden");
      }
    }

    if (discountBadgeEl) {
      let percent = productData.offer?.discountPercent;
      if ((!percent || percent <= 0) && op && op > p) {
        percent = Math.round(((op - p) / op) * 100);
      }
      if (percent && percent > 0) {
        discountBadgeEl.textContent = `خصم ${percent}%`;
        discountBadgeEl.classList.remove("hidden");
      } else {
        discountBadgeEl.classList.add("hidden");
      }
    }
  }

  updatePriceDisplay(basePrice, baseOldPrice);

  // ---------- حالة المخزون ----------
  if (stockBadgeEl) {
    const msg = productData.stockMessage || "متوفر";
    stockBadgeEl.textContent = msg;
    const status = productData.stockStatus || "in_stock";
    stockBadgeEl.classList.remove(
      "bg-emerald-50",
      "text-emerald-700",
      "bg-red-50",
      "text-red-700",
      "bg-slate-100",
      "text-slate-600"
    );
    if (status === "out_of_stock") {
      stockBadgeEl.classList.add("bg-red-50", "text-red-700");
    } else if (status === "limited") {
      stockBadgeEl.classList.add("bg-amber-50", "text-amber-700");
    } else {
      stockBadgeEl.classList.add("bg-emerald-50", "text-emerald-700");
    }
  }

  // ---------- عدّ تنازلي للعرض ----------
  if (
    productData.offer &&
    productData.offer.hasOffer &&
    productData.offer.endsAt &&
    countdownEl &&
    offerTimerWrapper
  ) {
    offerTimerWrapper.classList.remove("hidden");
    const deadline = new Date(productData.offer.endsAt).getTime();
    if (!isNaN(deadline)) {
      const timer = setInterval(() => {
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) {
          clearInterval(timer);
          countdownEl.textContent = "انتهى العرض";
          return;
        }
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        countdownEl.textContent =
          `${hours.toString().padStart(2, "0")} : ` +
          `${minutes.toString().padStart(2, "0")} : ` +
          `${seconds.toString().padStart(2, "0")}`;
      }, 1000);
    }
  }

  // ---------- المواصفات ----------
  if (specsListEl && Array.isArray(productData.specs)) {
    specsListEl.innerHTML = "";
    productData.specs.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${s.label}: ${s.value}`;
      specsListEl.appendChild(li);
    });
  }

  // ---------- بناء الخيارات (options) ----------
  const requiredOptions = [];

  if (optionsContainer && Array.isArray(productData.options)) {
    optionsContainer.innerHTML = "";
    productData.options.forEach((opt, index) => {
      if (!opt || !opt.key || !Array.isArray(opt.values)) return;
      requiredOptions.push(opt.key);

      // القسم
      const wrap = createEl(
        "div",
        index === 0 ? "" : "border-t border-slate-100 pt-4"
      );

      const header = createEl("div", "flex items-center justify-between mb-2");
      const title = createEl("h3", "text-xs font-semibold");
      title.textContent = opt.label || opt.key;
      header.appendChild(title);
      if (opt.helper) {
        const helper = createEl("span", "text-[11px] text-slate-500");
        helper.textContent = opt.helper;
        header.appendChild(helper);
      }
      wrap.appendChild(header);

      const group = createEl("div", "flex flex-wrap gap-2", {
        "data-option-group": opt.key,
      });

      opt.values.forEach((val) => {
        const optionName = opt.key;
        const optionValue = val.value;

        let btn;
        if (opt.type === "color") {
          btn = createEl(
            "button",
            "w-8 h-8 rounded-full border-2 border-transparent",
            {
              "data-color-select": "true",
              "data-option": optionName,
              "data-value": optionValue,
              "aria-label": val.label || optionValue,
            }
          );
          if (val.colorHex) {
            btn.style.backgroundColor = val.colorHex;
          } else {
            btn.classList.add("bg-slate-300");
          }
        } else {
          btn = createEl(
            "button",
            "px-4 py-2 rounded-full border border-slate-300 text-xs",
            {
              "data-option": optionName,
              "data-value": optionValue,
            }
          );
          btn.textContent = val.label || optionValue;
        }

        // افتراضي؟
        if (val.isDefault) {
          selectedAttrs[optionName] = optionValue;
          if (opt.type === "color") {
            btn.classList.add("border-brand-500", "ring-2", "ring-offset-2");
          } else {
            btn.classList.add("bg-slate-900", "text-white", "border-brand-500");
          }
        }

        group.appendChild(btn);
      });

      wrap.appendChild(group);
      optionsContainer.appendChild(wrap);
    });
  }

  // بعد ما بنينا الأزرار، نربط الأحداث
  const optionButtons = document.querySelectorAll("[data-option]");
  optionButtons.forEach((btn) => {
    const optionName = btn.getAttribute("data-option");
    const optionValue = btn.getAttribute("data-value");
    if (!optionName || !optionValue) return;

    btn.addEventListener("click", () => {
      selectedAttrs[optionName] = optionValue;

      document
        .querySelectorAll(`[data-option="${optionName}"]`)
        .forEach((b) => {
          b.classList.remove(
            "bg-slate-900",
            "bg-gray-900",
            "text-white",
            "border-brand-500",
            "ring-2",
            "ring-offset-2"
          );
          if (!b.hasAttribute("data-color-select")) {
            b.classList.add("border-slate-300");
          }
        });

      if (btn.hasAttribute("data-color-select")) {
        btn.classList.add("border-brand-500", "ring-2", "ring-offset-2");
      } else {
        btn.classList.remove("border-slate-300");
        btn.classList.add("bg-slate-900", "text-white", "border-brand-500");
      }

      applyVariantAndSync();
    });
  });

  // ---------- إيجاد الـ variant ----------
  function findMatchingVariant() {
    if (!variants.length) return null;
    return variants.find((variant) => {
      const attrs = variant.attrs || {};
      return Object.entries(selectedAttrs).every(([key, value]) => {
        if (!value) return true;
        return attrs[key] === value;
      });
    });
  }

  function applyVariantAndSync() {
    const v = findMatchingVariant();
    if (v) {
      currentVariant = v;
      updatePriceDisplay(v.price, v.oldPrice);
      // ممكن نحدّث حالة المخزون لو مختلفة
      if (stockBadgeEl && v.stockStatus) {
        // نفس المنطق السابق لكن من v
      }
    } else {
      currentVariant = null;
      updatePriceDisplay(basePrice, baseOldPrice);
    }
    syncAddToCartDataset();
  }

  // ---------- الكمية ----------
  const btnInc = document.querySelector("[data-qty-increase]");
  const btnDec = document.querySelector("[data-qty-decrease]");

  function normalizeQty() {
    if (!qtyInput) return 1;
    let val = parseInt(qtyInput.value || "1", 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    qtyInput.value = val;
    return val;
  }

  if (qtyInput) {
    qtyInput.addEventListener("change", () => {
      normalizeQty();
      syncAddToCartDataset();
    });
  }
  if (btnInc) {
    btnInc.addEventListener("click", () => {
      if (!qtyInput) return;
      let v = normalizeQty();
      v = Math.min(v + 1, 99);
      qtyInput.value = v;
      syncAddToCartDataset();
    });
  }
  if (btnDec) {
    btnDec.addEventListener("click", () => {
      if (!qtyInput) return;
      let v = normalizeQty();
      v = Math.max(v - 1, 1);
      qtyInput.value = v;
      syncAddToCartDataset();
    });
  }

  // ---------- Toast ----------
  function showToast(message, type = "error") {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-message");
    if (!toast || !msgEl) {
      alert(message);
      return;
    }
    msgEl.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("flex");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("flex");
    }, 2500);
  }

  // ---------- Add to cart ----------
  function syncAddToCartDataset() {
    if (!addToCartBtn) return;

    const productName = productData.name || "منتج بدون اسم";

    const priceText = priceEl ? priceEl.textContent || "0" : "0";
    const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0;

    let productId = productData.id || "product-1";
    if (currentVariant && currentVariant.id) {
      productId = currentVariant.id;
    }

    const qty = normalizeQty();
    const imageSrc = mainImageEl ? mainImageEl.getAttribute("src") || "" : "";

    addToCartBtn.setAttribute("data-add-to-cart", "true");
    addToCartBtn.setAttribute("data-product-id", productId);
    addToCartBtn.setAttribute("data-product-name", productName);
    addToCartBtn.setAttribute("data-product-price", String(numericPrice));
    addToCartBtn.setAttribute("data-product-qty", String(qty));

    if (imageSrc) {
      addToCartBtn.setAttribute("data-product-image", imageSrc);
    }

    addToCartBtn.setAttribute(
      "data-product-options",
      JSON.stringify(selectedAttrs)
    );

    if (currentVariant && currentVariant.sku) {
      addToCartBtn.setAttribute("data-product-sku", currentVariant.sku);
    }

    // حدّث أزرار المفضلة أيضاً
    wishlistButtons.forEach((btn) => {
      btn.setAttribute("data-product-id", productId);
      btn.setAttribute("data-product-name", productName);
      btn.setAttribute("data-product-price", String(numericPrice));
      if (imageSrc) btn.setAttribute("data-product-image", imageSrc);
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", (e) => {
      const missing = requiredOptions.filter((name) => !selectedAttrs[name]);
      if (missing.length > 0 && requiredOptions.length > 0) {
        e.preventDefault();
        showToast(
          "يرجى اختيار جميع المواصفات قبل إضافة المنتج إلى السلة.",
          "error"
        );
        return;
      }
      syncAddToCartDataset();
      // الباقي يتكفّل به cart.js
    });
  }

  // ---------- تبويب الوصف / المواصفات / التقييمات ----------
  const tabButtons = document.querySelectorAll("[data-tab-button]");
  const tabContents = document.querySelectorAll("[data-tab-content]");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => {
        b.classList.remove("border-slate-900");
        b.classList.add("text-slate-500", "border-transparent");
      });

      btn.classList.add("border-slate-900");
      btn.classList.remove("text-slate-500", "border-transparent");

      tabContents.forEach((content) => {
        if (content.getAttribute("data-tab-content") === target) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      });
    });
  });

  // ---------- الإكسسوارات ----------
  if (
    accessoriesSection &&
    accessoriesContainer &&
    Array.isArray(productData.accessories) &&
    productData.accessories.length
  ) {
    accessoriesSection.classList.remove("hidden");
    accessoriesContainer.innerHTML = "";
    productData.accessories.forEach((acc) => {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition";

      const link = createEl("a", "block relative", {
        href: `/src/pages/product.html?id=${encodeURIComponent(acc.id)}`,
      });
      const imgWrap = createEl("div", "aspect-[3/4] bg-slate-100");
      imgWrap.innerHTML = `<div class="w-full h-full bg-cover bg-center" style="background-image:url('${acc.image}')"></div>`;
      link.appendChild(imgWrap);
      card.appendChild(link);

      const body = createEl("div", "p-3 space-y-1 text-xs");
      const name = createEl("p", "text-slate-500");
      name.textContent = acc.name;
      const bottom = createEl("div", "flex items-center justify-between");
      const priceSpan = createEl("span", "font-bold text-brand-600");
      priceSpan.textContent = formatPrice(acc.price);
      const wishBtn = createEl(
        "button",
        "text-xs text-slate-500 hover:text-pink-500",
        { "data-wishlist-button": "true" }
      );
      wishBtn.textContent = "♡";

      bottom.appendChild(priceSpan);
      bottom.appendChild(wishBtn);
      body.appendChild(name);
      body.appendChild(bottom);
      card.appendChild(body);

      accessoriesContainer.appendChild(card);
    });
  }

  // ---------- منتجات مشابهة ----------
  if (
    relatedSection &&
    relatedContainer &&
    Array.isArray(productData.relatedProducts) &&
    productData.relatedProducts.length
  ) {
    relatedSection.classList.remove("hidden");
    relatedContainer.innerHTML = "";
    productData.relatedProducts.forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition";

      const link = createEl("a", "block relative", {
        href: `/src/pages/product.html?id=${encodeURIComponent(p.id)}`,
      });
      const imgWrap = createEl("div", "aspect-[3/4] bg-slate-100");
      imgWrap.innerHTML = `<div class="w-full h-full bg-cover bg-center" style="background-image:url('${p.image}')"></div>`;
      link.appendChild(imgWrap);
      card.appendChild(link);

      const body = createEl("div", "p-3 space-y-1 text-xs");
      const name = createEl("p", "text-slate-500");
      name.textContent = p.name;
      const bottom = createEl("div", "flex items-center justify-between");
      const priceSpan = createEl("span", "font-bold text-brand-600");
      priceSpan.textContent = formatPrice(p.price);
      const wishBtn = createEl(
        "button",
        "text-xs text-slate-500 hover:text-pink-500",
        { "data-wishlist-button": "true" }
      );
      wishBtn.textContent = "♡";

      bottom.appendChild(priceSpan);
      bottom.appendChild(wishBtn);
      body.appendChild(name);
      body.appendChild(bottom);
      card.appendChild(body);

      relatedContainer.appendChild(card);
    });
  }

  // ---------- تهيئة أولية ----------
  normalizeQty();
  if (variants.length) {
    applyVariantAndSync();
  } else {
    updatePriceDisplay(basePrice, baseOldPrice);
    syncAddToCartDataset();
  }
});
