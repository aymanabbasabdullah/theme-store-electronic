document.addEventListener("DOMContentLoaded", async () => {
  // 1) اقرأ الكاتيجوري من الـ URL
  const params = new URLSearchParams(window.location.search);
  const currentCategory = params.get("category") || "all"; // mobiles / laptops / tvs ...

  // 2) حمّل المنتجات من JSON
  const res = await fetch("/src/data/products.json");
  const productsData = await res.json();

  const allProducts = Object.values(productsData);

  // 3) فلترة حسب الكاتيجوري
  const visibleProducts =
    currentCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === currentCategory);

  // 4) ارسم فقط اللي طلعوا بعد الفلترة
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  visibleProducts.forEach((p) => {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group";

    // مهم تخزن الكاتيجوري في data-* عشان filters.js يقدر يشتغل لو حبيت
    card.dataset.product = "";
    card.dataset.category = p.category || "";
    card.dataset.brand = p.brand || "";
    card.dataset.price = p.basePrice || 0;

    card.innerHTML = `
      <a href="/src/pages/product.html?id=${encodeURIComponent(
        p.id
      )}" class="block relative">
        <div class="aspect-3/4 bg-slate-100">
          <div
            class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
            style="background-image:url('${
              (p.images && p.images.main) ||
              "https://via.placeholder.com/400x500?text=Product"
            }')"
          ></div>
        </div>
      </a>
      <div class="p-3 space-y-1 text-xs">
        <p class="text-slate-500">${p.name}</p>
        <p class="text-[11px] text-slate-500">
          ${p.shortDescription || ""}
        </p>
        <div class="flex items-center justify-between mt-1">
          <div class="flex items-baseline gap-1">
            <span class="font-bold text-red-600">
              ${(p.basePrice || 0).toLocaleString("en-US")} ريال
            </span>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
});
