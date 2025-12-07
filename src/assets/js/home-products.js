// /src/assets/js/home-products.js

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ home-products.js loaded"); // للتأكد أنه يشتغل

  try {
    // 1) تحميل المنتجات من ملف JSON
    const res = await fetch("/src/data/products.json");
    const productsData = await res.json();

    const allProducts = Object.values(productsData);

    // 2) تحديد المنتجات الخاصة بالصفحة الرئيسية من الحقول الجديدة
    const newArrivals = allProducts.filter((p) => p.isNewArrival).slice(0, 4); // لو أكثر من 4، نأخذ أول 4
    const bestSellers = allProducts.filter((p) => p.isBestSeller).slice(0, 4);

    // 3) رسم الكروت في الأقسام
    renderNewArrivals(newArrivals);
    renderBestSellers(bestSellers);
  } catch (err) {
    console.error("خطأ في تحميل بيانات الصفحة الرئيسية:", err);
  }
});

// ====== مساعدات صغيرة ======

function getMainImage(p) {
  return (
    (p.images && p.images.main) ||
    "https://via.placeholder.com/500x500?text=Product"
  );
}

function getPrice(p) {
  if (typeof p.basePrice === "number") return p.basePrice;
  if (Array.isArray(p.variants) && p.variants[0]?.price)
    return p.variants[0].price;
  return 0;
}

function getChipsHtml(p) {
  // نستخدم أول 3 مواصفات كـ chips
  if (!Array.isArray(p.specs)) return "";
  return p.specs
    .slice(0, 3)
    .map((s) => `<span class="chip">${s.value}</span>`)
    .join("");
}

// ====== قسم "وصل حديثاً" ======

function renderNewArrivals(products) {
  const grid = document.getElementById("home-new-grid");
  if (!grid) return;
  grid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className =
      "group relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-2xl transition flex flex-col h-full";

    const img = getMainImage(p);
    const price = getPrice(p);
    const rating = p.rating ?? 4.7;
    const ratingCount = p.ratingCount ?? 0;
    const chipsHtml = getChipsHtml(p);

    // الـ badge اللي في أعلى اليمين
    let topRightBadgeText = "";
    let topRightBadgeClass = "px-2 py-0.5 rounded-full bg-slate-900 text-white";

    if (p.offer && p.offer.hasOffer && p.offer.discountPercent) {
      topRightBadgeText = `خصم ${p.offer.discountPercent}%`;
      topRightBadgeClass =
        "px-2 py-0.5 rounded-full bg-red-500/10 text-red-600";
    } else if (
      p.category === "mobiles" &&
      typeof p.name === "string" &&
      p.name.includes("5G")
    ) {
      topRightBadgeText = "5G";
      topRightBadgeClass = "px-2 py-0.5 rounded-full bg-slate-900 text-white";
    } else if (p.isNewArrival) {
      topRightBadgeText = "إصدار جديد";
      topRightBadgeClass =
        "px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700";
    }

    // الـ badge الصغيرة اللي داخل الصورة (مثلاً: جديد 2025)
    const innerBadgeText = p.isNewArrival ? "جديد 2025" : "";

    card.innerHTML = `
      <!-- Top meta -->
      <div
        class="px-4 pt-3 flex items-center justify-between text-[11px] text-slate-500"
      >
        <span class="inline-flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ${p.stockStatus === "out_of_stock" ? "غير متوفر" : "متوفر الآن"}
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
      )}" class="block mt-2">
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
      <div class="p-4 flex flex-col gap-2 flex-1">
        <div
          class="flex items-center justify-between text-[11px] text-slate-500"
        >
          <span>${p.categoryLabel || ""}</span>
          <span class="flex items-center gap-1">
            <span class="text-amber-400">★</span>
            <span>${rating.toFixed(1)}</span>
            <span class="text-slate-400">(${ratingCount} مراجعة)</span>
          </span>
        </div>

        <a
          href="/src/pages/product.html?id=${encodeURIComponent(p.id)}"
          class="text-sm font-semibold line-clamp-2 hover:text-brand-600"
        >
          ${p.name}
        </a>

        <div class="flex flex-wrap gap-1.5 mt-1">
          ${chipsHtml}
        </div>

        <div class="flex items-center justify-between mt-auto pt-2">
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] text-slate-400">${
              p.offer?.hasOffer ? "السعر بعد الخصم" : "السعر"
            }</span>
            <div class="flex items-baseline gap-1">
              <span class="text-base font-bold ${
                p.offer?.hasOffer ? "text-red-600" : "text-slate-900"
              }">
                ${price.toLocaleString("en-US")}
              </span>
              <span class="text-[11px] text-slate-500">ريال</span>
            </div>
            ${
              p.offer?.hasOffer && p.oldPrice
                ? `<span class="text-[11px] text-slate-400 line-through">
                    ${p.oldPrice.toLocaleString("en-US")} ريال
                  </span>`
                : ""
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center justify-center rounded-full bg-brand-600 text-white text-[11px] px-4 py-1.5 hover:bg-brand-700"
              data-add-to-cart
              data-product-id="${p.id}"
            >
              أضف للسلة
            </button>
            <button
              class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-200"
              data-wishlist-button
              data-product-id="${p.id}"
              aria-label="إضافة للمفضلة"
            >
              ♡
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ====== قسم "الأكثر مبيعاً" ======

function renderBestSellers(products) {
  const grid = document.getElementById("home-best-grid");
  if (!grid) return;
  grid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className =
      "group relative rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] hover:-translate-y-1 hover:shadow-2xl transition overflow-hidden flex flex-col h-full";

    const img = getMainImage(p);
    const price = getPrice(p);
    const rating = p.rating ?? 4.8;
    const chipsHtml = getChipsHtml(p);

    card.innerHTML = `
      <div
        class="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-400/70 to-transparent pointer-events-none"
      ></div>

      <!-- Badge -->
      <div
        class="relative px-4 pt-3 flex items-center justify-between text-[11px]"
      >
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-amber-300"
        >
          ⭐ الأكثر مبيعاً
        </span>
        <span class="text-black">${p.categoryLabel || ""}</span>
      </div>

      <!-- Image -->
      <a
        href="/src/pages/product.html?id=${encodeURIComponent(p.id)}"
        class="relative block mt-1"
      >
        <div class="px-4">
          <div
            class="aspect-[4/3] rounded-2xl bg-slate-900/5 overflow-hidden flex items-center justify-center"
          >
            <div
              class="w-[80%] h-[80%] bg-[url('${img}')] bg-center bg-cover rounded-2xl group-hover:scale-105 transition-transform"
            ></div>
          </div>
        </div>
      </a>

      <!-- Info -->
      <div class="relative p-4 flex flex-col gap-2 flex-1">
        <p class="text-[11px] text-slate-500 flex items-center gap-1">
          ${p.categoryLabel || ""} •
          <span class="text-amber-500">تقييم ${rating.toFixed(1)}</span>
        </p>
        <a
          href="/src/pages/product.html?id=${encodeURIComponent(p.id)}"
          class="text-sm font-semibold line-clamp-2 hover:text-brand-600"
        >
          ${p.name}
        </a>
        <div class="flex flex-wrap gap-1.5 mt-1">
          ${chipsHtml}
        </div>

        <div class="mt-auto pt-2 flex items-center justify-between">
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] text-slate-400">السعر</span>
            <div class="flex items-baseline gap-1">
              <span class="text-base font-bold text-slate-900">
                ${price.toLocaleString("en-US")}
              </span>
              <span class="text-[11px] text-slate-500">ريال</span>
            </div>
          </div>
          <button
            class="inline-flex items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[11px] px-4 py-1.5 hover:bg-amber-300"
            data-add-to-cart
            data-product-id="${p.id}"
          >
            أضف للسلة
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}
